const express = require("express");
const router = express.Router();

/* ================= CONTROLLERS ================= */

const {
  addMedicine,
  getMedicines,
  updateMedicine,
  deleteMedicine
} = require("../controllers/medicineController");

/* ================= MIDDLEWARE ================= */

const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/role");


/* ======================================================
   💊 MEDICINE ROUTES (PRODUCTION READY)
====================================================== */

/* 🔐 ADD MEDICINE (Admin ONLY) */
router.post(
  "/add",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res, next) => {
    try {

      const { name, price, sellingPrice } = req.body;

      if (!name || price == null || sellingPrice == null) {
        return res.status(400).json({
          message: "Name, purchase price and selling price are required"
        });
      }

      if (Number(price) < 0 || Number(sellingPrice) < 0) {
        return res.status(400).json({
          message: "Price values must be positive"
        });
      }

      next();

    } catch (err) {
      console.error("❌ ADD MEDICINE ROUTE ERROR:", err.message);
      res.status(500).json({ message: "Failed to add medicine" });
    }
  },
  addMedicine
);


/* 🔐 GET MEDICINES (Admin + Staff) */
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "staff"),
  async (req, res, next) => {
    try {
      next();
    } catch (err) {
      console.error("❌ GET MEDICINE ROUTE ERROR:", err.message);
      res.status(500).json({ message: "Failed to fetch medicines" });
    }
  },
  getMedicines
);


/* 🔐 UPDATE MEDICINE (Admin ONLY) */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res, next) => {
    try {

      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Medicine ID is required" });
      }

      next();

    } catch (err) {
      console.error("❌ UPDATE MEDICINE ROUTE ERROR:", err.message);
      res.status(500).json({ message: "Failed to update medicine" });
    }
  },
  updateMedicine
);


/* 🔐 DELETE MEDICINE (Admin ONLY) */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res, next) => {
    try {

      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Medicine ID is required" });
      }

      next();

    } catch (err) {
      console.error("❌ DELETE MEDICINE ROUTE ERROR:", err.message);
      res.status(500).json({ message: "Failed to delete medicine" });
    }
  },
  deleteMedicine
);


/* ======================================================
   🚀 EXPORT
====================================================== */

module.exports = router;