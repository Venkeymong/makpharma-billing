const express = require("express");
const router = express.Router();

const { login } = require("../controllers/authController");
const User = require("../models/user");
const authMiddleware = require("../middleware/auth");
const bcrypt = require("bcryptjs");
const sendOTPEmail = require("../utils/mailer");

console.log("✅ AUTH ROUTES FILE LOADED");

/* ======================================================
   🔐 AUTH
====================================================== */

// 🔹 LOGIN
router.post("/login", login);


/* ======================================================
   👤 PROFILE
====================================================== */

// 🔹 GET PROFILE
router.get("/profile", authMiddleware, async (req, res) => {
  try {

    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);

  } catch (err) {
    console.error("❌ PROFILE ERROR:", err.message);
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
});


// 🔹 UPDATE PROFILE
router.put("/profile", authMiddleware, async (req, res) => {
  try {

    const allowedFields = ["username", "email"];
    const updates = {};

    for (let key of allowedFields) {
      if (req.body[key]) updates[key] = req.body[key];
    }

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    return res.json(updated);

  } catch (err) {
    console.error("❌ PROFILE UPDATE ERROR:", err.message);
    return res.status(500).json({ message: "Failed to update profile" });
  }
});


/* ======================================================
   🔒 OTP SYSTEM (FIXED)
====================================================== */

// 🔹 SEND OTP
router.post("/send-otp", async (req, res) => {
  try {

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔢 GENERATE OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetOtp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;

    await user.save();

    // 🔥 WAIT FOR EMAIL (FIXED)
    const emailSent = await sendOTPEmail(user.email, otp);

    if (!emailSent) {
      return res.status(500).json({
        message: "Failed to send OTP"
      });
    }

    return res.json({
      message: "OTP sent successfully"
    });

  } catch (err) {
    console.error("❌ SEND OTP ERROR:", err.message);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
});


// 🔹 VERIFY OTP
router.post("/verify-otp", async (req, res) => {
  try {

    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email & OTP required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.resetOtp || user.resetOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (!user.otpExpiry || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    return res.json({
      message: "OTP verified",
      success: true
    });

  } catch (err) {
    console.error("❌ VERIFY OTP ERROR:", err.message);
    return res.status(500).json({ message: "Verification failed" });
  }
});


// 🔹 RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email & password required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    /* 🔐 STRONG PASSWORD CHECK */
    const strongPassword =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!strongPassword.test(password)) {
      return res.status(400).json({
        message: "Password must be strong (8+ chars, capital, number, symbol)"
      });
    }

    // ❌ PREVENT SAME PASSWORD
    const isSame = await bcrypt.compare(password, user.password);

    if (isSame) {
      return res.status(400).json({
        message: "New password cannot be same as old password"
      });
    }

    // 🔐 SAVE
    user.password = password;
    user.resetOtp = null;
    user.otpExpiry = null;

    await user.save();

    return res.json({
      message: "Password reset successful"
    });

  } catch (err) {
    console.error("❌ RESET ERROR:", err.message);
    return res.status(500).json({ message: "Failed to reset password" });
  }
});


/* ======================================================
   🚀 EXPORT
====================================================== */

module.exports = router;