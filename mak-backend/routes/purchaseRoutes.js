const express = require("express");
const router = express.Router();

/* ================= CONTROLLERS ================= */

const {
  addPurchase,
  getPurchases,
  deletePurchase
} = require("../controllers/purchaseController");

/* ================= MIDDLEWARE ================= */

const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/role");

/* ================= ROUTES ================= */

/* 🔐 ADD PURCHASE (Admin ONLY) */
router.post(
  "/add",
  authMiddleware,
  roleMiddleware("admin"),
  addPurchase
);

/* 🔐 GET PURCHASES (Admin + Staff) */
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "staff"),
  getPurchases
);

/* 🔐 DELETE PURCHASE (Admin ONLY) */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deletePurchase
);

module.exports = router;