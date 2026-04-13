const Medicine = require("../models/medicine");

/* =========================================
   ➕ ADD MEDICINE
========================================= */

exports.addMedicine = async (req, res) => {
  try {

    const { name, price, sellingPrice, batch } = req.body;

    /* 🔒 VALIDATION */
    if (!name || price == null || sellingPrice == null) {
      return res.status(400).json({
        success: false,
        message: "Name, purchase price and selling price are required"
      });
    }

    /* 🔒 CHECK DUPLICATE (IMPORTANT) */
    const existing = await Medicine.findOne({
      name: name.trim(),
      batch: batch?.trim() || ""
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Medicine with same batch already exists"
      });
    }

    const medicine = new Medicine(req.body);

    const saved = await medicine.save();

    return res.status(201).json({
      success: true,
      message: "Medicine added successfully",
      data: saved
    });

  } catch (error) {

    console.error("❌ Add Medicine Error:", error);

    /* 🔥 HANDLE DUPLICATE INDEX ERROR */
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate medicine entry"
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add medicine"
    });
  }
};


/* =========================================
   📥 GET ALL MEDICINES
========================================= */

exports.getMedicines = async (req, res) => {
  try {

    const medicines = await Medicine.find().sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: medicines
    });

  } catch (error) {

    console.error("❌ Get Medicines Error:", error);

    return res.status(500).json({
      success: false,
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
        success: false,
        message: "Invalid medicine ID"
      });
    }

    /* 🔒 SAFE UPDATE */
    const updated = await Medicine.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found"
      });
    }

    return res.json({
      success: true,
      message: "Medicine updated successfully",
      data: updated
    });

  } catch (error) {

    console.error("❌ Update Medicine Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update medicine"
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
        success: false,
        message: "Invalid medicine ID"
      });
    }

    const deleted = await Medicine.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found"
      });
    }

    return res.json({
      success: true,
      message: "Medicine deleted successfully"
    });

  } catch (error) {

    console.error("❌ Delete Medicine Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete medicine"
    });
  }
};