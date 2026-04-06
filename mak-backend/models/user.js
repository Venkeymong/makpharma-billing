const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,     // 🔥 MUST
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },

  // 🔥 OTP FIELDS (for reset password)
  resetOtp: String,
  otpExpiry: Date

}, { timestamps: true });

/* ✅ FIX: Prevent OverwriteModelError */
module.exports =
  mongoose.models.User ||
  mongoose.model("User", userSchema);