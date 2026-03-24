const mongoose = require("mongoose");

const purchaseItemSchema = new mongoose.Schema({
  medicine: String,
  hsn: String,
  batch: String,
  qty: Number,
  price: Number,
  gst: Number,
  total: Number
});

const purchaseSchema = new mongoose.Schema({
  supplier: String,
  invoice: String,
  date: String,
  items: [purchaseItemSchema],
  totalAmount: Number,
  billFile: String
}, { timestamps: true });

/* ✅ FIX: Prevent OverwriteModelError */
module.exports =
  mongoose.models.Purchase ||
  mongoose.model("Purchase", purchaseSchema);