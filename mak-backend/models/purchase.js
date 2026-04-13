const mongoose = require("mongoose");

/* =========================================
   🧾 PURCHASE ITEM SCHEMA
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

  /* 💰 SELLING PRICE */
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
    default: 0,
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
    default: 0,
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
   🔥 PRE-SAVE (AUTO CALCULATION + SAFE)
========================================= */

purchaseSchema.pre("save", function () {

  let totalAmount = 0;

  this.items = this.items.map(item => {

    const qty = Number(item.qty) || 0;
    const price = Number(item.price) || 0;
    const sellingPrice = Number(item.sellingPrice) || price;
    const gst = Number(item.gst) || 0;

    const total = qty * price;

    totalAmount += total;

    return {
      ...item,
      qty,
      price,
      sellingPrice,
      gst,
      total
    };
  });

  this.totalAmount = totalAmount;

});


/* =========================================
   🔥 INDEX (OPTIONAL OPTIMIZATION)
========================================= */

purchaseSchema.index({ createdAt: -1 });


/* =========================================
   🔥 SAFE EXPORT
========================================= */

module.exports =
  mongoose.models.Purchase ||
  mongoose.model("Purchase", purchaseSchema);