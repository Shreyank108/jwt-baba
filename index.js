const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./auth/authRoutes');
const authMiddleware = require('./auth/authMiddleware');
const passkeyRoutes = require('./auth/passkeyRoutes');
const { initWebAuthnService } = require('./utils/webauthnService');

let User;

function initAuthSystem(app, options = {}) {
  dotenv.config();

  const PORT = process.env.PORT || 5000;
  const MONGO_URI = process.env.MONGO_URI
    .replace('${DB_USER}', process.env.DB_USER)
    .replace('${DB_PASS}', process.env.DB_PASS);
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!MONGO_URI || !JWT_SECRET) {
    console.error('❌ MONGO_URI and JWT_SECRET must be defined in .env file');
    return;
  }

  User = options.customUserModel
    ? (mongoose.models.User || options.customUserModel)
    : (mongoose.models.User || require('./models/User'));

  // Initialize WebAuthn if configuration is provided
  let webauthnEnabled = false;
  if (options.webauthn) {
    try {
      const webauthnConfig = {
        rpName: options.webauthn.rpName || 'JWT-BABA',
        rpID: options.webauthn.rpID || process.env.WEBAUTHN_RP_ID,
        origin: options.webauthn.origin || process.env.WEBAUTHN_ORIGIN
      };

      if (webauthnConfig.rpID && webauthnConfig.origin) {
        initWebAuthnService(webauthnConfig);
        webauthnEnabled = true;
        console.log('✅ WebAuthn/Passkey authentication enabled');
      } else {
        console.log('⚠️  WebAuthn disabled: WEBAUTHN_RP_ID and WEBAUTHN_ORIGIN not configured');
      }
    } catch (err) {
      console.error('❌ WebAuthn initialization failed:', err.message);
      console.log('⚠️  Continuing without passkey support');
    }
  }

  // 🚀 System starts directly — no Baba needed
  (async () => {
    try {
      await mongoose.connect(MONGO_URI);
      console.log('✅ MongoDB Connected');
    } catch (err) {
      console.error('❌ MongoDB Error:', err);
    }

    // Traditional password authentication routes
    app.use('/api/auth', authRoutes(JWT_SECRET));

    // Passkey/WebAuthn routes (if enabled)
    if (webauthnEnabled) {
      app.use('/api/auth/passkey', passkeyRoutes(JWT_SECRET));
    }

    app.get('/protected', authMiddleware(JWT_SECRET), (req, res) => {
      res.send(`🛡️ Welcome ${req.user.email}, you have accessed a protected route.`);
    });

    app.listen(PORT, () => console.log(`🚀 Server running on PORT ${PORT}`));
  })();
}

module.exports = initAuthSystem;
module.exports.authMiddleware = authMiddleware;
module.exports.User = () => User;
