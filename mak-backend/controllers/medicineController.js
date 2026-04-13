const Medicine = require("../models/medicine");

/* =========================================
   ➕ ADD MEDICINE
========================================= */

exports.addMedicine = async (req, res) => {
  try {

    const { name, price, sellingPrice } = req.body;

    /* 🔒 VALIDATION */
    if (!name || price == null || sellingPrice == null) {
      return res.status(400).json({
        message: "Name, purchase price and selling price are required"
      });
    }

    console.log("📥 Adding Medicine:", req.body);

    const medicine = new Medicine(req.body);

    const saved = await medicine.save();

    res.status(201).json(saved);

  } catch (error) {

    console.error("❌ Add Medicine Error:", error);

    res.status(500).json({
      message: "Failed to add medicine"
    });
  }
};


/* =========================================
   📥 GET ALL MEDICINES
========================================= */

exports.getMedicines = async (req, res) => {
  try {

    const medicines = await Medicine.find().sort({ createdAt: -1 });

    res.json(medicines);

  } catch (error) {

    console.error("❌ Get Medicines Error:", error);

    res.status(500).json({
      message: "Failed to fetch medicines"
    });
  }
};


/* =========================================
   ✏️ UPDATE MEDICINE
========================================= */

exports.updateMedicine = async (req, res) => {
  try {

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Invalid medicine ID"
      });
    }

    console.log("✏️ Updating Medicine:", id);

    const updated = await Medicine.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Medicine not found"
      });
    }

    res.json(updated);

  } catch (error) {

    console.error("❌ Update Medicine Error:", error);

    res.status(500).json({
      message: "Failed to update medicine"
    });
  }
};


/* =========================================
   ❌ DELETE MEDICINE
========================================= */

exports.deleteMedicine = async (req, res) => {
  try {

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Invalid medicine ID"
      });
    }

    console.log("🗑️ Deleting Medicine:", id);

    const deleted = await Medicine.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        message: "Medicine not found"
      });
    }

    res.json({
      message: "Medicine deleted successfully"
    });

  } catch (error) {

    console.error("❌ Delete Medicine Error:", error);

    res.status(500).json({
      message: "Failed to delete medicine"
    });
  }
};