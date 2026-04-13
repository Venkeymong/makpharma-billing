const mongoose = require("mongoose");

/* =========================================
   🔥 CONNECT DATABASE (LATEST MONGOOSE FIX)
========================================= */

const connectDB = async () => {
  try {

    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

  } catch (error) {

    console.error("❌ MongoDB Connection Error:", error.message);

    // retry after 5 sec
    setTimeout(connectDB, 5000);
  }
};


/* =========================================
   🔥 CONNECTION EVENTS
========================================= */

mongoose.connection.on("connected", () => {
  console.log("🟢 Mongoose connected");
});

mongoose.connection.on("error", (err) => {
  console.error("🔴 Mongoose error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("🟠 Mongoose disconnected");
});


/* =========================================
   🔥 GRACEFUL SHUTDOWN
========================================= */

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("🛑 MongoDB disconnected on app termination");
  process.exit(0);
});


module.exports = connectDB;