const express = require("express");
const router = express.Router();

/* ================= CONTROLLER ================= */

const { getDashboard } = require("../controllers/dashboardController");

/* ================= MIDDLEWARE ================= */

const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/role");


/* ======================================================
   📊 DASHBOARD ROUTE (PRODUCTION READY)
====================================================== */

/* 🔐 DASHBOARD (Admin + Staff) */
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "staff"),
  async (req, res, next) => {
    try {

      // Optional future filters (safe parsing)
      const { startDate, endDate } = req.query;

      if (startDate && isNaN(Date.parse(startDate))) {
        return res.status(400).json({ message: "Invalid startDate" });
      }

      if (endDate && isNaN(Date.parse(endDate))) {
        return res.status(400).json({ message: "Invalid endDate" });
      }

      next();

    } catch (err) {
      console.error("❌ DASHBOARD ROUTE ERROR:", err.message);
      res.status(500).json({ message: "Failed to load dashboard" });
    }
  },
  getDashboard
);


/* ======================================================
   🚀 EXPORT
====================================================== */

module.exports = router;