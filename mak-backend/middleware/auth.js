// middleware/auth.js

const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {

  try {

    /* ================= GET HEADER ================= */
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: 'No token provided'
      });
    }

    /* ================= EXTRACT TOKEN ================= */
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        message: 'Invalid token format'
      });
    }

    const token = parts[1];

    /* ================= VERIFY TOKEN ================= */
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /* ================= DEBUG (REMOVE LATER) ================= */
    console.log('Decoded Token:', decoded);

    /* ================= ATTACH USER ================= */
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role || 'admin' // 🔥 fallback safety
    };

    /* ================= NEXT ================= */
    next();

  } catch (error) {

    console.error('Auth Middleware Error:', error);

    /* ================= TOKEN ERROR ================= */
    return res.status(401).json({
      message: 'Unauthorized access'
    });

  }

};

module.exports = authMiddleware;