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

// ✅ CORS (SAFE FOR ANGULAR + NO ERRORS)
app.use(cors());

// ✅ HANDLE PREFLIGHT (NO * OR /* USED)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.sendStatus(200);
  }
  next();
});

// ✅ JSON parser
app.use(express.json());

// ✅ CACHE CONTROL
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

/* ======================================================
   🔥 DEBUG ROUTES
====================================================== */

app.get("/test", (req, res) => {
  res.send("🔥 SERVER WORKING");
});

app.get("/", (req, res) => {
  res.send("🚀 Pharmacy Backend API Running...");
});

/* ======================================================
   📦 ROUTES IMPORT
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
   ❌ 404 HANDLER
====================================================== */

app.use((req, res) => {
  console.warn("❌ ROUTE NOT FOUND:", req.method, req.url);
  res.status(404).json({
    message: "Route not found"
  });
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