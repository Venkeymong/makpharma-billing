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

  /* 🔐 ROLE (IMPORTANT FOR YOUR SYSTEM) */
  role: {
    type: String,
    enum: ["admin", "staff"],
    default: "admin"
  },

  /* 🔑 OTP RESET */
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
   🔒 HASH PASSWORD BEFORE SAVE
========================================= */

userSchema.pre("save", async function (next) {

  // Only hash if password modified
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});


/* =========================================
   🔑 COMPARE PASSWORD METHOD
========================================= */

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


/* =========================================
   🔥 SAFE EXPORT
========================================= */

module.exports =
  mongoose.models.User ||
  mongoose.model("User", userSchema);