const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {

    /* ======================================================
       🔐 GET AUTH HEADER
    ====================================================== */
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    /* ======================================================
       🔍 VALIDATE FORMAT (Bearer TOKEN)
    ====================================================== */
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format. Use Bearer token.'
      });
    }

    /* ======================================================
       ✅ VERIFY TOKEN
    ====================================================== */
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /* ======================================================
       👤 ATTACH USER DATA
    ====================================================== */
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role || 'admin' // fallback role
    };

    /* ======================================================
       🚀 NEXT
    ====================================================== */
    next();

  } catch (error) {

    console.error('🔴 Auth Error:', error.message);

    /* ======================================================
       ⚠️ HANDLE TOKEN ERRORS
    ====================================================== */

    // Token expired
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }

    // Invalid token
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    // Generic error
    return res.status(500).json({
      success: false,
      message: 'Authentication failed.'
    });
  }
};

module.exports = authMiddleware;