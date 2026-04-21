const express = require("express");
const router = express.Router();

/* ================= CONTROLLERS ================= */

const {
  addCustomer,
  getCustomers,
  updateCustomer,
  deleteCustomer
} = require("../controllers/customerController");

/* ================= MIDDLEWARE ================= */

const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/role");


/* ======================================================
   👤 CUSTOMER ROUTES (PRODUCTION READY)
====================================================== */

/* 🔐 ADD CUSTOMER (Admin + Staff) */
router.post(
  "/add",
  authMiddleware,
  roleMiddleware("admin", "staff"),
  async (req, res, next) => {
    try {
      const { name, phone } = req.body;

      if (!name || !phone) {
        return res.status(400).json({
          message: "Customer name and phone are required"
        });
      }

      return next();
    } catch (err) {
      console.error("❌ ADD CUSTOMER ROUTE ERROR:", err.message);
      return res.status(500).json({
        message: "Failed to add customer"
      });
    }
  },
  addCustomer
);


/* 🔐 GET CUSTOMERS (Admin + Staff) */
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "staff"),
  async (req, res, next) => {
    try {
      return next();
    } catch (err) {
      console.error("❌ GET CUSTOMER ROUTE ERROR:", err.message);
      return res.status(500).json({
        message: "Failed to fetch customers"
      });
    }
  },
  getCustomers
);


/* 🔐 UPDATE CUSTOMER (Admin + Staff) */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "staff"),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          message: "Customer ID is required"
        });
      }

      return next();
    } catch (err) {
      console.error("❌ UPDATE CUSTOMER ROUTE ERROR:", err.message);
      return res.status(500).json({
        message: "Failed to update customer"
      });
    }
  },
  updateCustomer
);


/* 🔐 DELETE CUSTOMER (Admin ONLY) */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          message: "Customer ID is required"
        });
      }

      return next();
    } catch (err) {
      console.error("❌ DELETE CUSTOMER ROUTE ERROR:", err.message);
      return res.status(500).json({
        message: "Failed to delete customer"
      });
    }
  },
  deleteCustomer
);


/* ======================================================
   🚀 EXPORT
====================================================== */

module.exports = router;