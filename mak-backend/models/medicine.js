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

module.exports = mongoose.model("Medicine", medicineSchema);