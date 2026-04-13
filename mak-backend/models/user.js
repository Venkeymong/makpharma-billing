
console.log("🔥 NEW USER MODEL LOADED");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/* =========================================
   👤 USER SCHEMA (PRODUCTION READY)
========================================= */

const userSchema = new mongoose.Schema({

  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please use a valid email"]
  },

  password: {
    type: String,
    required: true,
    minlength: 6
  },

  role: {
    type: String,
    enum: ["admin", "staff"],
    default: "admin"
  },

  resetOtp: {
    type: String,
    default: null
  },

  otpExpiry: {
    type: Date,
    default: null
  }

}, {
  timestamps: true
});


/* =========================================
   🔒 HASH PASSWORD (FIXED - NO NEXT)
========================================= */

userSchema.pre("save", async function () {

  // Only hash if password changed
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

});


/* =========================================
   🔑 COMPARE PASSWORD METHOD
========================================= */

userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};


/* =========================================
   🔥 SAFE EXPORT
========================================= */

module.exports =
  mongoose.models.User ||
  mongoose.model("User", userSchema);