const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  generic: String,
  manufacturer: String,
  hsn: String,
  batch: String,
  expiry: String,
  mrp: Number,
  sellingPrice: Number,
  gst: Number,
  stock: Number
}, { timestamps: true });

/* ✅ FIX: Prevent OverwriteModelError */
module.exports =
  mongoose.models.Medicine ||
  mongoose.model("Medicine", medicineSchema);