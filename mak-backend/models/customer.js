const mongoose = require("mongoose");

/* =========================================
   👤 CUSTOMER SCHEMA (PRODUCTION READY)
========================================= */

const customerSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    trim: true
  },

  phone: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    trim: true,
    default: ""
  },

  address: {
    type: String,
    trim: true,
    default: ""
  },

  state: {
    type: String,
    trim: true,
    default: "Tamil Nadu"
  },

  gst: {
    type: String,
    trim: true,
    default: ""
  }

}, {
  timestamps: true
});


/* =========================================
   🔥 INDEX (FASTER SEARCH)
========================================= */

customerSchema.index({ name: 1 });
customerSchema.index({ phone: 1 });


/* =========================================
   🔥 PRE SAVE (CLEAN DATA)
   ✅ FIXED (NO next())
========================================= */

customerSchema.pre("save", function () {

  if (this.name) this.name = this.name.trim();
  if (this.phone) this.phone = this.phone.trim();

});


/* =========================================
   🔥 SAFE EXPORT
========================================= */

module.exports =
  mongoose.models.Customer ||
  mongoose.model("Customer", customerSchema);