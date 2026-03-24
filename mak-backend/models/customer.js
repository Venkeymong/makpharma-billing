const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  address: String,
  state: String,
  gst: String
}, { timestamps: true });

module.exports = mongoose.model("Customer", customerSchema);