const jwt = require("jsonwebtoken");

/* =========================================
   🔐 AUTH MIDDLEWARE (PRODUCTION READY)
========================================= */

const authMiddleware = (req, res, next) => {
  try {

    /* ================= GET HEADER ================= */

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided."
      });
    }

    /* ================= FORMAT CHECK ================= */

    const parts = authHeader.split(" ");

    if (parts.length !== 2) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format."
      });
    }

    const [scheme, token] = parts;

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format. Use Bearer token."
      });
    }

    /* ================= SECRET CHECK ================= */

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("❌ JWT_SECRET missing");
      return res.status(500).json({
        success: false,
        message: "Server configuration error"
      });
    }

    /* ================= VERIFY TOKEN ================= */

    const decoded = jwt.verify(token, jwtSecret);

    /* ================= ATTACH USER ================= */

    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role || "admin"
    };

    return next();

  } catch (error) {

    console.error("🔴 Auth Error:", error.message);

    /* ================= TOKEN EXPIRED ================= */

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again."
      });
    }

    /* ================= INVALID TOKEN ================= */

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token."
      });
    }

    /* ================= DEFAULT ================= */

    return res.status(401).json({
      success: false,
      message: "Authentication failed."
    });
  }
};

module.exports = authMiddleware;