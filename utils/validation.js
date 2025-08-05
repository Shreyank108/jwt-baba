const Joi = require('joi');

// Define validation schemas
const registerSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s\-']+$/)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must be less than 50 characters',
      'string.pattern.base': 'Name can only contain letters, spaces, hyphens, and apostrophes',
      'any.required': 'Name is required'
    }),
  
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .min(5)
    .max(254)
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.min': 'Email must be at least 5 characters long',
      'string.max': 'Email must be less than 254 characters',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must be less than 128 characters',
      'string.pattern.base': 'Password must contain at least one letter and one number',
      'any.required': 'Password is required'
    })
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

// Validation middleware functions
const validateRegister = (req, res, next) => {
  const { error } = registerSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }
  
  // Sanitize inputs
  req.body.name = req.body.name.trim();
  req.body.email = req.body.email.trim().toLowerCase();
  req.body.password = req.body.password.trim();
  
  next();
};

const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }
  
  // Sanitize inputs
  req.body.email = req.body.email.trim().toLowerCase();
  req.body.password = req.body.password.trim();
  
  next();
};

module.exports = {
  validateRegister,
  validateLogin
};