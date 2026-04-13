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


/* ======================================================
   🧾 BILL ROUTES (SECURE + PRODUCTION)
====================================================== */

/* 🔐 CREATE BILL (Admin + Staff) */
router.post(
  "/add",
  authMiddleware,
  roleMiddleware("admin", "staff"),
  async (req, res, next) => {
    try {

      // ✅ Basic validation
      if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
        return res.status(400).json({ message: "Bill items are required" });
      }

      next();

    } catch (err) {
      console.error("❌ CREATE BILL ROUTE ERROR:", err.message);
      res.status(500).json({ message: "Failed to process bill request" });
    }
  },
  createBill
);


/* 🔐 GET ALL BILLS (Admin + Staff) */
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "staff"),
  async (req, res, next) => {
    try {
      next();
    } catch (err) {
      console.error("❌ GET BILL ROUTE ERROR:", err.message);
      res.status(500).json({ message: "Failed to fetch bills" });
    }
  },
  getBills
);


/* 🔐 DELETE BILL (Admin ONLY) */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res, next) => {
    try {

      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Bill ID is required" });
      }

      next();

    } catch (err) {
      console.error("❌ DELETE BILL ROUTE ERROR:", err.message);
      res.status(500).json({ message: "Failed to delete bill" });
    }
  },
  deleteBill
);


/* ======================================================
   🚀 EXPORT
====================================================== */

module.exports = router;