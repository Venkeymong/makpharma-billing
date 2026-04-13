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


/* ======================================================
   🧾 PURCHASE ROUTES (PRODUCTION READY)
====================================================== */

/* 🔐 ADD PURCHASE (Admin ONLY) */
router.post(
  "/add",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res, next) => {
    try {

      const { supplier, items } = req.body;

      if (!supplier) {
        return res.status(400).json({
          message: "Supplier is required"
        });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          message: "Purchase items are required"
        });
      }

      // 🔥 Validate each item
      for (let item of items) {
        if (!item.medicine || item.qty == null || item.price == null || item.sellingPrice == null) {
          return res.status(400).json({
            message: "Each item must have medicine, qty, purchase price, and selling price"
          });
        }
      }

      next();

    } catch (err) {
      console.error("❌ ADD PURCHASE ROUTE ERROR:", err.message);
      res.status(500).json({ message: "Failed to add purchase" });
    }
  },
  addPurchase
);


/* 🔐 GET PURCHASES (Admin + Staff) */
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "staff"),
  async (req, res, next) => {
    try {
      next();
    } catch (err) {
      console.error("❌ GET PURCHASE ROUTE ERROR:", err.message);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  },
  getPurchases
);


/* 🔐 DELETE PURCHASE (Admin ONLY) */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res, next) => {
    try {

      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          message: "Purchase ID is required"
        });
      }

      next();

    } catch (err) {
      console.error("❌ DELETE PURCHASE ROUTE ERROR:", err.message);
      res.status(500).json({ message: "Failed to delete purchase" });
    }
  },
  deletePurchase
);


/* ======================================================
   🚀 EXPORT
====================================================== */

module.exports = router;