require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/user");

async function createUsers() {
  try {

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected ✅");

    const users = [
      { username: "ArunKumar", password: "Arun1552" },
      { username: "Venkatesh", password: "kalaiV@999" }
    ];

    for (const u of users) {

      const existing = await User.findOne({ username: u.username });

      if (existing) {
        console.log(`⚠️ ${u.username} already exists`);
        continue;
      }

      const hashed = await bcrypt.hash(u.password, 10);

      await User.create({
        username: u.username,
        password: hashed
      });

      console.log(`✅ ${u.username} created`);
    }

    process.exit();

  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

createUsers();