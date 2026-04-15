const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendOTPEmail = require("../utils/mailer");

/* =========================================
   🔐 LOGIN (PRODUCTION READY)
========================================= */

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    /* ================= VALIDATION ================= */

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required"
      });
    }

    /* ================= FIND USER ================= */

    const user = await User.findOne({ username }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid username or password"
      });
    }

    /* ================= CHECK PASSWORD ================= */

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid username or password"
      });
    }

    /* ================= ROLE ================= */

    const role = user?.role || "admin";

    /* ================= TOKEN ================= */

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET not defined");
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: role
      },
      jwtSecret,
      {
        expiresIn: "1d"
      }
    );

    /* ================= RESPONSE ================= */

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        role: role
      }
    });

  } catch (err) {
    console.error("❌ Login Error:", err);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

/* =========================================
   🔁 SEND OTP (FIXED)
========================================= */

exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    /* ================= VALIDATION ================= */

    if (!email) {
      return res.status(400).json({
        message: "Email is required"
      });
    }

    /* ================= GENERATE OTP ================= */

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    /* ================= SEND EMAIL ================= */

    await sendOTPEmail(email, otp);

    console.log("✅ OTP Email Sent");

    /* ================= RESPONSE ================= */

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully"
    });

  } catch (err) {

    console.error("❌ EMAIL ERROR:", err);

    /* ================= ERROR RESPONSE ================= */

    return res.status(500).json({
      success: false,
      message: "Failed to send OTP"
    });
  }
};