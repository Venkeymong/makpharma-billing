const mongoose = require("mongoose");

/* ================= ITEMS ================= */

const billItemSchema = new mongoose.Schema({
  medicine: { type: String, required: true },
  qty: { type: Number, required: true },
  price: { type: Number, required: true },
  gst: { type: Number, default: 0 },
  total: { type: Number, required: true }
});

/* ================= BILL ================= */

const billSchema = new mongoose.Schema({

  // ✅ AUTO INVOICE NUMBER (UNIQUE)
  invoiceNumber: {
    type: String,
    unique: true,
    required: true
  },

  /* ================= CUSTOMER ================= */

  customerName: {
    type: String,
    default: "Walk-in"
  },

  customerPhone: {
    type: String,
    default: "-"
  },

  customerState: {
    type: String,
    default: "Tamil Nadu"
  },

  customerGST: {
    type: String,
    default: ""
  },

  /* ================= BILL DATA ================= */

  date: {
    type: Date,
    default: Date.now
  },

  items: [billItemSchema],

  /* ================= TOTALS ================= */

  subtotal: {
    type: Number,
    default: 0
  },

  cgst: {
    type: Number,
    default: 0
  },

  sgst: {
    type: Number,
    default: 0
  },

  igst: {
    type: Number,
    default: 0
  },

  totalAmount: {
    type: Number,
    required: true
  },

  paymentMethod: {
    type: String,
    default: "Cash"
  }

}, {
  timestamps: true
});

module.exports = mongoose.model("Bill", billSchema);