const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });

/* ✅ FIX: Prevent OverwriteModelError */
module.exports =
  mongoose.models.User ||
  mongoose.model("User", userSchema);