const mongoose = require("mongoose");

/* =========================================
   🧾 BILL ITEM SCHEMA
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
    default: 0,
    min: 0
  }

}, { _id: false });


/* =========================================
   🧾 BILL SCHEMA
========================================= */

const billSchema = new mongoose.Schema({

  /* ================= INVOICE ================= */

  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
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
    required: true,
    validate: v => v.length > 0
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
    default: 0,
    min: 0
  },

  paymentMethod: {
    type: String,
    enum: ["Cash", "Card", "UPI", "Credit"],
    default: "Cash"
  }

}, {
  timestamps: true
});


/* =========================================
   🔥 INDEX
========================================= */

billSchema.index({ createdAt: -1 });


/* =========================================
   🔥 PRE-SAVE (AUTO CALCULATION)
========================================= */

billSchema.pre("save", function () {
  console.log("✅ Pre-save running...");

  let subtotal = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  this.items.forEach(item => {
    const price = item.sellingPrice || item.price;

    // Calculate item total
    item.total = item.qty * price;

    subtotal += item.total;

    const gstAmount = (item.total * item.gst) / 100;

    // Assuming intra-state (CGST + SGST)
    cgst += gstAmount / 2;
    sgst += gstAmount / 2;
  });

  this.subtotal = subtotal;
  this.cgst = cgst;
  this.sgst = sgst;
  this.igst = igst;

  this.totalAmount = subtotal + cgst + sgst + igst;
});


/* =========================================
   🔥 SAFE EXPORT
========================================= */

module.exports =
  mongoose.models.Bill ||
  mongoose.model("Bill", billSchema);