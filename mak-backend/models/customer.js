const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  address: String,
  state: String,
  gst: String
}, { timestamps: true });

/* ✅ FIX: Prevent OverwriteModelError */
module.exports =
  mongoose.models.Customer ||
  mongoose.model("Customer", customerSchema);