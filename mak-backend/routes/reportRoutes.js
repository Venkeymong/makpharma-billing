const express = require("express");
const router = express.Router();

/* ================= CONTROLLER ================= */

const { getReport } = require("../controllers/reportController");

/* ================= MIDDLEWARE ================= */

const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/role");

/* ================= ROUTES ================= */

/* 🔐 GET REPORTS (Admin ONLY - Sensitive Data) */
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  getReport
);

module.exports = router;