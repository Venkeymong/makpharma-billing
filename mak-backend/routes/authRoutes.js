const express = require("express");
const router = express.Router();

const { login } = require("../controllers/authController");
const User = require("../models/user");
const authMiddleware = require("../middleware/auth");
const sendOTPEmail = require("../utils/mailer");
const bcrypt = require("bcryptjs");


/* ======================================================
   🔐 AUTH
====================================================== */

router.post("/login", login);


/* ======================================================
   🧪 DEBUG ROUTES (VERY IMPORTANT)
====================================================== */

// 👉 Check if auth routes are loaded
router.get("/check", (req, res) => {
  res.send("🔥 AUTH ROUTE WORKING");
});

// 👉 Check POST route existence
router.post("/ping", (req, res) => {
  res.json({ message: "🔥 POST ROUTE WORKING" });
});


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
    console.error("PROFILE ERROR:", err);
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
    console.error("PROFILE UPDATE ERROR:", err);
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

    const otp = Math.floor(100000 + Math.random() * 900000);

    user.resetOtp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;

    await user.save();

    await sendOTPEmail(email, otp);

    res.json({ message: "OTP sent successfully" });

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

    const user = await User.findOne({ email });

    if (!user || user.resetOtp != otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    res.json({ message: "OTP verified", success: true });

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

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    user.resetOtp = null;
    user.otpExpiry = null;

    await user.save();

    res.json({ message: "Password reset successful" });

  } catch (err) {
    console.error("❌ RESET ERROR:", err);
    res.status(500).json({ message: "Failed to reset password" });
  }
});


/* ======================================================
   🧪 TEST EMAIL
====================================================== */

router.get("/test-email", async (req, res) => {
  try {

    console.log("🔥 TEST EMAIL HIT");

    await sendOTPEmail("venkeymong444@gmail.com", 123456);

    res.json({ message: "Test email sent successfully!" });

  } catch (err) {
    console.error("❌ MAIL ERROR:", err);
    res.status(500).json({ message: "Failed to send email" });
  }
});


/* ======================================================
   🚀 EXPORT
====================================================== */

module.exports = router;