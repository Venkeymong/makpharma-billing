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

/* ================= ROUTES ================= */

/* 🔐 ADD MEDICINE (Admin ONLY) */
router.post(
  "/add",
  authMiddleware,
  roleMiddleware("admin"),
  addMedicine
);

/* 🔐 GET MEDICINES (Admin + Staff) */
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "staff"),
  getMedicines
);

/* 🔐 UPDATE MEDICINE (Admin ONLY) */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  updateMedicine
);

/* 🔐 DELETE MEDICINE (Admin ONLY) */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteMedicine
);

module.exports = router;