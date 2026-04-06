require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/user");

async function createUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected ✅");

    const userData = {
      username: "Venkatesh",
      email: "venkeymong444@gmail.com",
      password: "kalaiV@999"
    };

    const email = userData.email.toLowerCase();

    // 🔥 DELETE ALL EXISTING USERS (CLEAN START)
    await User.deleteMany({});
    console.log("🧹 Old users cleared");

    // 🔐 HASH PASSWORD
    const hashed = await bcrypt.hash(userData.password, 10);

    // ✅ CREATE NEW USER
    await User.create({
      username: userData.username,
      email: email,
      password: hashed
    });

    console.log("✅ Venkatesh created successfully");
    console.log(`📧 Email: ${email}`);
    console.log("🔑 Password: kalaiV@999");

    console.log("🎉 Setup complete");
    process.exit();

  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

createUser();