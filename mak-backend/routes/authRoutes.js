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
   👤 PROFILE
====================================================== */

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch {
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
  } catch {
    res.status(500).json({ message: "Failed to update profile" });
  }
});


/* ======================================================
   🔒 OTP SYSTEM 🔥
====================================================== */

// 🔹 SEND OTP
router.post("/send-otp", async (req, res) => {
  try {

    const { email } = req.body;

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
    console.error("SEND OTP ERROR:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});


// 🔹 VERIFY OTP
router.post("/verify-otp", async (req, res) => {
  try {

    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user || user.resetOtp != otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    res.json({ success: true });

  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    res.status(500).json({ message: "Verification failed" });
  }
});


// 🔹 RESET PASSWORD (bcrypt 🔐)
router.post("/reset-password", async (req, res) => {
  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;

    user.resetOtp = null;
    user.otpExpiry = null;

    await user.save();

    res.json({ message: "Password reset successful" });

  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ message: "Failed to reset password" });
  }
});


/* ======================================================
   🧪 TEST EMAIL
====================================================== */

router.get("/test-email", async (req, res) => {
  try {
    await sendOTPEmail("venkeymong444@gmail.com", 123456);
    res.json({ message: "Test email sent successfully!" });
  } catch (err) {
    console.error("MAIL ERROR:", err);
    res.status(500).json({ message: "Failed to send email" });
  }
});


/* ======================================================
   🚀 EXPORT
====================================================== */

module.exports = router;