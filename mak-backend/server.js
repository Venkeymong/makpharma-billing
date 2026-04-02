require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

/* ================= CREATE APP ================= */
const app = express();

/* ======================================================
   🔌 DATABASE CONNECTION
====================================================== */
connectDB();

/* ======================================================
   ⚙️ MIDDLEWARE
====================================================== */

// ✅ CORS
app.use(cors({
  origin: "*",
  credentials: true
}));

// ✅ JSON parser
app.use(express.json());

// ✅ CACHE CONTROL (important)
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

/* ======================================================
   🔥 DEBUG ROUTES (VERY IMPORTANT)
====================================================== */

// 👉 ROOT TEST
app.get("/test", (req, res) => {
  res.send("🔥 SERVER WORKING");
});

/* ======================================================
   📦 ROUTES IMPORT (AFTER APP INIT)
====================================================== */

const medicineRoutes = require("./routes/medicineRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const billRoutes = require("./routes/billRoutes");
const customerRoutes = require("./routes/customerRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reportRoutes = require("./routes/reportRoutes");
const authRoutes = require("./routes/authRoutes");

/* ======================================================
   📌 ROUTES
====================================================== */

// Health check
app.get("/", (req, res) => {
  res.send("🚀 Pharmacy Backend API Running...");
});

// API routes
app.use("/api/medicines", medicineRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/auth", authRoutes);

// 👉 AUTH DEBUG
app.get("/api/auth/check", (req, res) => {
  res.send("🔥 AUTH ROUTE WORKING");
});

/* ======================================================
   ❌ ERROR HANDLER
====================================================== */
app.use((err, req, res, next) => {
  console.error("🔥 ERROR:", err.stack);
  res.status(500).json({
    message: "Internal Server Error",
    error: err.message
  });
});

/* ======================================================
   🚀 SERVER START
====================================================== */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});