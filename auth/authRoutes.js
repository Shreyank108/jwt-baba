const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validateRegister, validateLogin } = require('../utils/validation');

const authRoutes = (User) => {
  const router = express.Router();

  // Register route with validation
  router.post('/register', validateRegister, async (req, res) => {
    try {
      const { name, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create user
      const user = new User({ name, email, password: hashedPassword });
      await user.save();

      // Generate JWT token
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      // Remove password from response
      const userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      };

      res.status(201).json({
        success: true,
        message: 'User registered and logged in successfully',
        token,
        user: userResponse
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  // Login route with validation
  router.post('/login', validateLogin, async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      // Remove password from response
      const userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      };

      res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: userResponse
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  return router;
};

module.exports = authRoutes;