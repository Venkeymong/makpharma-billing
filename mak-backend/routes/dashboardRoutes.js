const express = require("express");
const router = express.Router();

/* ================= CONTROLLER ================= */

const { getDashboard } = require("../controllers/dashboardController");

/* ================= MIDDLEWARE ================= */

const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/role");

/* ================= ROUTES ================= */

/* 🔐 DASHBOARD (Admin + Staff) */
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "staff"),
  getDashboard
);

module.exports = router;