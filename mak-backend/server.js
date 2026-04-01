require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Routes
const medicineRoutes = require("./routes/medicineRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const billRoutes = require("./routes/billRoutes");
const customerRoutes = require("./routes/customerRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reportRoutes = require("./routes/reportRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

/* ======================================================
   🔌 DATABASE CONNECTION
====================================================== */
connectDB();

/* ======================================================
   ⚙️ MIDDLEWARE
====================================================== */

// 🔥 CACHE CONTROL (VERY IMPORTANT FIX)
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

// CORS (allow frontend)
app.use(cors({
  origin: "*", // later change to your Angular URL
  credentials: true
}));

// JSON parser
app.use(express.json());

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

/* ======================================================
   ❌ ERROR HANDLER (GLOBAL)
====================================================== */
app.use((err, req, res, next) => {
  console.error("🔥 Error:", err.stack);
  res.status(500).json({
    message: "Something went wrong",
    error: err.message
  });
});

/* ======================================================
   🚀 SERVER START
====================================================== */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});