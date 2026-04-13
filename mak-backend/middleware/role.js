const roleMiddleware = (...allowedRoles) => {

  return (req, res, next) => {
    try {

      /* ================= CHECK USER ================= */

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized. User not found."
        });
      }

      /* ================= GET ROLE ================= */

      const userRole = req.user.role || "admin";

      /* ================= VALIDATION ================= */

      if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
        console.warn("⚠️ No roles defined for route");
        return next(); // allow if no restriction
      }

      /* ================= ACCESS CHECK ================= */

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Insufficient permissions."
        });
      }

      /* ================= ALLOW ================= */

      next();

    } catch (error) {

      console.error("❌ Role Middleware Error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  };

};

module.exports = roleMiddleware;