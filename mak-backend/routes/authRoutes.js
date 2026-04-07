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

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);

  } catch (err) {
    console.error("❌ PROFILE ERROR:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      req.body,
      { new: true }
    ).select("-password");

    res.json(updated);

  } catch (err) {
    console.error("❌ PROFILE UPDATE ERROR:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});


/* ======================================================
   🔒 OTP SYSTEM
====================================================== */

// 🔹 SEND OTP
router.post("/send-otp", async (req, res) => {
  try {
    console.log("🔥 SEND OTP HIT");

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ GENERATE OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetOtp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;

    await user.save();

    console.log("✅ OTP GENERATED:", otp);

    // 🔥 SEND EMAIL IN BACKGROUND (NO BLOCKING)
    sendOTPEmail(user.email, otp)
      .then(() => console.log("✅ EMAIL SENT"))
      .catch(err => console.error("❌ EMAIL ERROR:", err.message));

    // ✅ INSTANT RESPONSE (NO WAIT)
    res.json({
      message: "OTP sent successfully"
    });

  } catch (err) {
    console.error("❌ SEND OTP ERROR:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});


// 🔹 VERIFY OTP
router.post("/verify-otp", async (req, res) => {
  try {
    console.log("🔥 VERIFY OTP HIT");

    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email & OTP required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.resetOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    res.json({
      message: "OTP verified",
      success: true
    });

  } catch (err) {
    console.error("❌ VERIFY OTP ERROR:", err);
    res.status(500).json({ message: "Verification failed" });
  }
});


// 🔹 RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  try {
    console.log("🔥 RESET PASSWORD HIT");

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email & password required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔐 STRONG PASSWORD CHECK
    const strongPassword =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!strongPassword.test(password)) {
      return res.status(400).json({
        message:
          "Password must be strong (8+ chars, capital, number, symbol)"
      });
    }

    // ❌ PREVENT OLD PASSWORD
    const isSame = await bcrypt.compare(password, user.password);

    if (isSame) {
      return res.status(400).json({
        message: "New password cannot be same as old password"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetOtp = null;
    user.otpExpiry = null;

    await user.save();

    res.json({
      message: "Password reset successful"
    });

  } catch (err) {
    console.error("❌ RESET ERROR:", err);
    res.status(500).json({ message: "Failed to reset password" });
  }
});


/* ======================================================
   🚀 EXPORT
====================================================== */

module.exports = router;