const express = require("express");
const router = express.Router();

/* ================= CONTROLLERS ================= */

const {
  createBill,
  getBills,
  deleteBill
} = require("../controllers/billController");

/* ================= MIDDLEWARE ================= */

const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/role");

/* ================= ROUTES ================= */

/* 🔐 CREATE BILL (Admin + Staff) */
router.post(
  "/add",
  authMiddleware,
  roleMiddleware("admin", "staff"),
  createBill
);

/* 🔐 GET ALL BILLS (Admin + Staff) */
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "staff"),
  getBills
);

/* 🔐 DELETE BILL (Admin ONLY) */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteBill
);

module.exports = router;