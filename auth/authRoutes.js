const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function authRoutes(JWT_SECRET) {
  const router = express.Router();

  // ✅ REGISTER + AUTO LOGIN
  router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ message: 'User already exists' });

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ name, email, password: hashedPassword });
      await user.save();

      // ✅ Auto-generate token after register
      const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

      res.status(201).json({
        message: 'User registered and logged in successfully',
        token,
        user,
      });
    } catch (err) {
      console.error('❌ Registration error:', err);
      res.status(500).json({ message: 'Error in registration' });
    }
  });

  // ✅ LOGIN
  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: 'Invalid credentials' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

      const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

      res.json({ message: 'Login successful', token, user });
    } catch (err) {
      console.error('❌ Login error:', err);
      res.status(500).json({ message: 'Login error' });
    }
  });

  return router;
}

module.exports = authRoutes;
