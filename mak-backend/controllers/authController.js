const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
        message: "Invalid username or password" // 🔥 secure message
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

    const role = user.role || "admin";

    /* ================= TOKEN ================= */

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not defined");
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    /* ================= RESPONSE ================= */

    res.status(200).json({
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

    res.status(500).json({
      message: "Server error"
    });

  }
};