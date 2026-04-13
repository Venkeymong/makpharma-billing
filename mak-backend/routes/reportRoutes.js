const express = require("express");
const router = express.Router();

/* ================= CONTROLLER ================= */

const { getReport } = require("../controllers/reportController");

/* ================= MIDDLEWARE ================= */

const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/role");


/* ======================================================
   📊 REPORT ROUTE (SECURE + PRODUCTION READY)
====================================================== */

/* 🔐 GET REPORTS (Admin ONLY - Sensitive Data) */
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res, next) => {
    try {

      const { type, startDate, endDate } = req.query;

      const validTypes = ["daily", "weekly", "monthly", "custom"];

      // ✅ Validate type
      if (type && !validTypes.includes(type)) {
        return res.status(400).json({
          message: "Invalid report type"
        });
      }

      // ✅ Validate custom dates
      if (type === "custom") {

        if (!startDate || !endDate) {
          return res.status(400).json({
            message: "Start date and end date are required for custom report"
          });
        }

        if (isNaN(Date.parse(startDate)) || isNaN(Date.parse(endDate))) {
          return res.status(400).json({
            message: "Invalid date format"
          });
        }

      }

      next();

    } catch (err) {
      console.error("❌ REPORT ROUTE ERROR:", err.message);
      res.status(500).json({ message: "Failed to generate report" });
    }
  },
  getReport
);


/* ======================================================
   🚀 EXPORT
====================================================== */

module.exports = router;