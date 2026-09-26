const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const babaBlessing = require('../utils/babaBlessing');

function authRoutes(JWT_SECRET) {
  const router = express.Router();

  // Hash password with SHA256 for credential validation
  const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');

  // ✅ REGISTER + AUTO LOGIN with token pair
  router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
      }

      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ message: 'User already exists' });

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ name, email, password: hashedPassword });
      await user.save();

      const tokens = babaBlessing.generateTokens({
        userId: user._id.toString(),
        email: user.email,
        name: user.name
      });

      res.status(201).json({
        message: '🔓 Baba ki kripa se user registered successfully',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: { id: user._id, email: user.email, name: user.name }
      });
    } catch (err) {
      console.error('❌ Registration error:', err);
      res.status(500).json({ message: 'Error in registration' });
    }
  });

  // ✅ LOGIN with rate limiting & token pair
  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
      }

      const user = await User.findOne({ email });
      if (!user) {
        babaBlessing._audit('LOGIN_ATTEMPT', email, 'FAILED', { reason: 'user_not_found' });
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        babaBlessing._audit('LOGIN_ATTEMPT', email, 'FAILED', { reason: 'password_mismatch' });
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const tokens = babaBlessing.generateTokens({
        userId: user._id.toString(),
        email: user.email,
        name: user.name
      });

      res.json({
        message: '🔓 Baba ki kripa se login successful',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: { id: user._id, email: user.email, name: user.name }
      });
    } catch (err) {
      console.error('❌ Login error:', err);
      res.status(500).json({ message: err.message || 'Login error' });
    }
  });

  // ✅ REFRESH TOKEN - Get new access token
  router.post('/refresh', (req, res) => {
    const { refreshToken } = req.body;
    try {
      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token required' });
      }

      const tokens = babaBlessing.refreshAccessToken(refreshToken);
      res.json({
        message: 'Token refreshed',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });
    } catch (err) {
      res.status(401).json({ message: 'Invalid refresh token', error: err.message });
    }
  });

  // ✅ LOGOUT - Revoke refresh token
  router.post('/logout', (req, res) => {
    const { refreshToken } = req.body;
    try {
      if (refreshToken) {
        babaBlessing.revokeToken(refreshToken);
      }
      res.json({ message: 'Logged out successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Logout error' });
    }
  });

  // ✅ VERIFY TOKEN
  router.post('/verify', (req, res) => {
    const { token } = req.body;
    try {
      const decoded = babaBlessing.verifyAccessToken(token);
      res.json({ valid: true, user: decoded });
    } catch (err) {
      res.status(401).json({ valid: false, message: err.message });
    }
  });

  return router;
}

module.exports = authRoutes;
