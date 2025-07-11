const jwt = require('jsonwebtoken');

function authMiddleware(JWT_SECRET) {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token missing' });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(403).json({ message: 'Invalid or expired token' });
    }
  };
}

module.exports = authMiddleware;