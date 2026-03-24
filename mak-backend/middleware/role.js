// middleware/role.js

const roleMiddleware = (...allowedRoles) => {

  return (req, res, next) => {

    try {

      /* 🔥 FALLBACK ROLE (IMPORTANT) */
      const userRole = req.user?.role || "admin";

      /* 🔐 CHECK ACCESS */
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ message: "Access denied" });
      }

      next();

    } catch (error) {

      console.error("Role Middleware Error:", error);
      return res.status(500).json({ message: "Server error" });

    }

  };

};

module.exports = roleMiddleware;