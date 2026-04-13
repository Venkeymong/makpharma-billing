const mongoose = require("mongoose");

/* =========================================
   🧾 BILL ITEM SCHEMA (PRO)
========================================= */

const billItemSchema = new mongoose.Schema({

  medicine: {
    type: String,
    required: true,
    trim: true
  },

  batch: {
    type: String,
    default: ""
  },

  qty: {
    type: Number,
    required: true,
    min: 1
  },

  /* 💰 PURCHASE PRICE */
  price: {
    type: Number,
    required: true,
    min: 0
  },

  /* 💰 SELLING PRICE */
  sellingPrice: {
    type: Number,
    default: 0,
    min: 0
  },

  gst: {
    type: Number,
    default: 0
  },

  total: {
    type: Number,
    required: true,
    min: 0
  }

}, { _id: false });


/* =========================================
   🧾 BILL SCHEMA (PRODUCTION READY)
========================================= */

const billSchema = new mongoose.Schema({

  /* ================= INVOICE ================= */

  invoiceNumber: {
    type: String,
    unique: true,   // ✅ KEEP THIS ONLY
    required: true,
    trim: true
  },

  /* ================= CUSTOMER ================= */

  customerName: {
    type: String,
    default: "Walk-in",
    trim: true
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

  items: {
    type: [billItemSchema],
    required: true
  },

  /* ================= TOTALS ================= */

  subtotal: {
    type: Number,
    default: 0,
    min: 0
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
    required: true,
    min: 0
  },

  paymentMethod: {
    type: String,
    default: "Cash"
  }

}, {
  timestamps: true
});


/* =========================================
   🔥 INDEX (ONLY NECESSARY ONES)
========================================= */

// ❌ REMOVED duplicate invoice index
// ✅ Keep only useful index
billSchema.index({ createdAt: -1 });


/* =========================================
   🔥 PRE SAVE (AUTO FIX)
========================================= */

billSchema.pre("save", function (next) {

  this.subtotal = this.subtotal || 0;
  this.totalAmount = this.totalAmount || 0;

  next(); // ✅ NOW VALID
});


/* =========================================
   🔥 SAFE EXPORT
========================================= */

module.exports =
  mongoose.models.Bill ||
  mongoose.model("Bill", billSchema);