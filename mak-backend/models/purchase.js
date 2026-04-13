const mongoose = require("mongoose");

/* =========================================
   🧾 PURCHASE ITEM (STRONG STRUCTURE)
========================================= */

const purchaseItemSchema = new mongoose.Schema({

  medicine: {
    type: String,
    required: true,
    trim: true
  },

  hsn: {
    type: String,
    default: "",
    trim: true
  },

  batch: {
    type: String,
    default: "",
    trim: true
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

  /* 💰 SELLING PRICE (IMPORTANT FOR PROFIT) */
  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  },

  gst: {
    type: Number,
    default: 0,
    min: 0
  },

  total: {
    type: Number,
    required: true,
    min: 0
  }

}, { _id: false });


/* =========================================
   🧾 PURCHASE SCHEMA
========================================= */

const purchaseSchema = new mongoose.Schema({

  supplier: {
    type: String,
    required: true,
    trim: true
  },

  invoice: {
    type: String,
    default: "",
    trim: true
  },

  date: {
    type: Date,
    default: Date.now
  },

  items: {
    type: [purchaseItemSchema],
    required: true,
    validate: v => v.length > 0
  },

  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },

  billFile: {
    type: String,
    default: ""
  }

}, {
  timestamps: true
});


/* =========================================
   🔥 PRE SAVE (AUTO FIX NUMBERS)
========================================= */

purchaseSchema.pre("save", function (next) {

  this.totalAmount = Number(this.totalAmount) || 0;

  this.items = this.items.map(item => ({
    ...item,
    qty: Number(item.qty) || 0,
    price: Number(item.price) || 0,
    sellingPrice: Number(item.sellingPrice) || 0,
    gst: Number(item.gst) || 0,
    total: Number(item.total) || 0
  }));

  next();
});


/* =========================================
   🔥 EXPORT SAFE MODEL
========================================= */

module.exports =
  mongoose.models.Purchase ||
  mongoose.model("Purchase", purchaseSchema);