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

/* ================= ROUTES ================= */

/* 🔐 ADD CUSTOMER (Admin + Staff) */
router.post(
  "/add",
  authMiddleware,
  roleMiddleware("admin", "staff"),
  addCustomer
);

/* 🔐 GET CUSTOMERS (Admin + Staff) */
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "staff"),
  getCustomers
);

/* 🔐 UPDATE CUSTOMER (Admin + Staff) */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "staff"),
  updateCustomer
);

/* 🔐 DELETE CUSTOMER (Admin ONLY) */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteCustomer
);

module.exports = router;