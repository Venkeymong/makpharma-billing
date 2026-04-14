const express = require("express");
const router = express.Router();

/* ================= CONTROLLERS ================= */

const {
  createBill,
  getBills,
  deleteBill,
  updateBill // 🔥 ADDED
} = require("../controllers/billController");

/* ================= MIDDLEWARE ================= */

const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/role");


/* ======================================================
   🧾 BILL ROUTES (PRODUCTION READY)
====================================================== */

/* 🔐 CREATE BILL (Admin + Staff) */
router.post(
  "/add",
  authMiddleware,
  roleMiddleware("admin", "staff"),
  async (req, res, next) => {
    try {

      const { items } = req.body;

      /* ✅ VALIDATION */
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Bill items are required"
        });
      }

      next();

    } catch (error) {

      console.error("❌ CREATE BILL ROUTE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to process bill request"
      });
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
    } catch (error) {

      console.error("❌ GET BILL ROUTE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch bills"
      });
    }
  },
  getBills
);


/* 🔥 UPDATE BILL (Admin + Staff) */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "staff"),
  async (req, res, next) => {
    try {

      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Bill ID is required"
        });
      }

      next();

    } catch (error) {

      console.error("❌ UPDATE BILL ROUTE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to update bill"
      });
    }
  },
  updateBill
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
        return res.status(400).json({
          success: false,
          message: "Bill ID is required"
        });
      }

      next();

    } catch (error) {

      console.error("❌ DELETE BILL ROUTE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to delete bill"
      });
    }
  },
  deleteBill
);


/* ======================================================
   🚀 EXPORT
====================================================== */

module.exports = router;