// ✅ authMiddleware.js
const jwt = require('jsonwebtoken');

function authMiddleware(JWT_SECRET) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("🚫 No token provided");
      return res.status(401).json({ message: 'Token missing' });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log("✅ Token decoded:", decoded); // 🔍 for debugging
      req.user = decoded; // ✅ Important: this adds the user info
      next();
    } catch (err) {
      console.error("❌ Token verification failed:", err.message);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
  };
}

module.exports = authMiddleware;
