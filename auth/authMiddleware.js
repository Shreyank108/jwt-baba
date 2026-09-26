const babaBlessing = require('../utils/babaBlessing');

function authMiddleware(JWT_SECRET) {
  // Use babaBlessing middleware if available, else fallback to JWT_SECRET
  if (JWT_SECRET && typeof JWT_SECRET === 'string') {
    // Backward compatibility: old JWT_SECRET mode
    return (req, res, next) => {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token missing' });
      }

      const token = authHeader.slice(7);

      try {
        req.user = babaBlessing.verifyAccessToken(token);
        next();
      } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token', error: err.message });
      }
    };
  }

  // New mode: use babaBlessing directly
  return babaBlessing.middleware();
}

module.exports = authMiddleware;
