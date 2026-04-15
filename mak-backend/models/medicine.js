const mongoose = require("mongoose");

/* =========================================
   💊 MEDICINE SCHEMA (PRODUCTION SAFE)
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
    default: 0,
    min: 0
  },

  /* 💰 SELLING PRICE */
  sellingPrice: {
    type: Number,
    required: true,
    default: 0,
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
   🔥 UNIQUE INDEX
========================================= */

medicineSchema.index(
  { name: 1, batch: 1 },
  { unique: true }
);


/* =========================================
   🔥 PRE-SAVE (SAFE NORMALIZATION)
========================================= */

medicineSchema.pre("save", function () {

  /* ✅ SAFE STRING CLEANING */
  this.name = (this.name || "").trim();
  this.batch = (this.batch || "").trim();

  /* ✅ SAFE NUMBER NORMALIZATION */
  this.price = Number(this.price) || 0;
  this.sellingPrice = Number(this.sellingPrice) || 0;
  this.mrp = Number(this.mrp) || this.sellingPrice;
  this.gst = Number(this.gst) || 0;
  this.stock = Number(this.stock) || 0;

});


/* =========================================
   🔥 STATIC METHODS
========================================= */

// Reduce stock safely
medicineSchema.statics.reduceStock = async function (name, batch, qty, session) {

  const med = await this.findOne({ name, batch }).session(session);

  if (!med) {
    throw new Error(`Medicine not found: ${name}`);
  }

  if ((med.stock || 0) < qty) {
    throw new Error(`Insufficient stock for ${name}`);
  }

  med.stock -= qty;

  await med.save({ session });

  return med;
};


// Restore stock safely
medicineSchema.statics.restoreStock = async function (name, batch, qty, session) {

  const med = await this.findOne({ name, batch }).session(session);

  if (med) {

    med.price = Number(med.price) || 0;
    med.sellingPrice = Number(med.sellingPrice) || 0;

    med.stock += qty;

    await med.save({ session });
  }

  return med;
};


/* =========================================
   🔥 SAFE EXPORT
========================================= */

module.exports =
  mongoose.models.Medicine ||
  mongoose.model("Medicine", medicineSchema);