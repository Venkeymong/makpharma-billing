require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/user");

/* =========================================
   🔌 CONNECT DB
========================================= */

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🟢 MongoDB Connected");
  } catch (err) {
    console.error("❌ DB Error:", err.message);
    process.exit(1);
  }
};


/* =========================================
   👤 CREATE DEFAULT USER
========================================= */

const createUser = async () => {
  try {

    await connectDB();

    const userData = {
      username: "Venkatesh",
      email: "venkeymong444@gmail.com",
      password: "kalaiV@999"
    };

    const email = userData.email.toLowerCase();

    /* 🔥 CHECK IF USER EXISTS */
    const existing = await User.findOne({ email });

    if (existing) {
      console.log("⚠️ User already exists");
      process.exit();
    }

    /* 🔐 PASSWORD HASH (optional if already handled in model) */
    const hashed = await bcrypt.hash(userData.password, 10);

    /* ✅ CREATE USER */
    await User.create({
      username: userData.username,
      email: email,
      password: hashed,
      role: "admin"
    });

    console.log("✅ Admin user created successfully");
    console.log(`📧 Email: ${email}`);
    console.log("🔑 Password: kalaiV@999");

    console.log("🎉 Setup complete");

    process.exit();

  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
};


/* =========================================
   🚀 RUN
========================================= */

createUser();