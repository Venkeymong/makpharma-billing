const mongoose = require("mongoose");

/* =========================================
   💊 MEDICINE SCHEMA (FINAL PRODUCTION)
========================================= */

const medicineSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    trim: true
  },

  generic: {
    type: String,
    trim: true,
    default: ""
  },

  manufacturer: {
    type: String,
    trim: true,
    default: ""
  },

  hsn: {
    type: String,
    trim: true,
    default: ""
  },

  batch: {
    type: String,
    trim: true,
    default: ""
  },

  expiry: {
    type: String,
    default: ""
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

  /* 💰 MRP */
  mrp: {
    type: Number,
    default: 0,
    min: 0
  },

  gst: {
    type: Number,
    default: 0,
    min: 0
  },

  stock: {
    type: Number,
    default: 0,
    min: 0
  }

}, {
  timestamps: true
});


/* =========================================
   🔥 UNIQUE INDEX (NO DUPLICATE MEDICINE)
========================================= */

medicineSchema.index(
  { name: 1, batch: 1 },
  { unique: true }
);


/* =========================================
   🔥 CLEAN & AUTO FIX
========================================= */

medicineSchema.pre("save", function (next) {

  // Clean strings
  this.name = this.name?.trim();
  this.batch = this.batch?.trim();

  // Fix numbers
  this.price = Number(this.price) || 0;
  this.sellingPrice = Number(this.sellingPrice) || 0;
  this.mrp = Number(this.mrp) || this.sellingPrice;
  this.gst = Number(this.gst) || 0;
  this.stock = Number(this.stock) || 0;

  next();
});


/* =========================================
   🔥 SAFE EXPORT
========================================= */

module.exports =
  mongoose.models.Medicine ||
  mongoose.model("Medicine", medicineSchema);