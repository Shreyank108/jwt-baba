const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./auth/authRoutes');
const authMiddleware = require('./auth/authMiddleware');
const babaBlessing = require('./utils/babaBlessing');

let User; // ✅ Will hold your model reference

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

  // ✅ Avoid OverwriteModelError
  User = options.customUserModel 
    ? (mongoose.models.User || options.customUserModel)
    : (mongoose.models.User || require('./models/User'));

  babaBlessing(async () => {
    try {
      await mongoose.connect(MONGO_URI);
      console.log('✅ MongoDB Connected');
    } catch (err) {
      console.error('❌ MongoDB Error:', err);
    }

    app.use(express.json());
    app.use('/api/auth', authRoutes(JWT_SECRET));

    app.get('/protected', authMiddleware(JWT_SECRET), (req, res) => {
      res.send(`🛡️ Welcome ${req.user.email}, Baba ki kripa se access mila.`);
    });

    app.listen(PORT, () => console.log(`🚀 Server running on PORT ${PORT}`));
  });
}

// ✅ Exports for users
module.exports = initAuthSystem;
module.exports.authMiddleware = authMiddleware;
module.exports.User = () => User;
