require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/user");

async function createUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected ✅");

    const users = [
      {
        username: "ArunKumar",
        email: "venkeymong444@gmail.com",
        password: "Arun1552"
      },
      {
        username: "Venkatesh",
        email: "venkeymong444@gmail.com",
        password: "kalaiV@999"
      },
      {
        username: "Dharanesh",
        email: "venkeymong444@gmail.com",
        password: "raja@123"
      }
    ];

    for (const u of users) {

      const email = u.email.toLowerCase();

      // 🔥 CHECK BOTH USERNAME + EMAIL
      const existing = await User.findOne({
        $or: [
          { username: u.username },
          { email: email }
        ]
      });

      if (existing) {
        console.log(`⚠️ User already exists: ${u.username} / ${email}`);
        continue;
      }

      const hashed = await bcrypt.hash(u.password, 10);

      await User.create({
        username: u.username,
        email: email,
        password: hashed
      });

      console.log(`✅ ${u.username} created with email ${email}`);
    }

    console.log("🎉 User creation process completed");
    process.exit();

  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

createUsers();