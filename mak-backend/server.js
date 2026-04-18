require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

/* =========================================
   🚀 CREATE APP
========================================= */
const app = express();

/* =========================================
   🔌 DATABASE CONNECTION
========================================= */
connectDB();

/* =========================================
   ⚙️ CORS (SAFE PRODUCTION VERSION)
========================================= */

const allowedOrigins = [
  "http://localhost:4200",
  "http://127.0.0.1:4200",
  "https://clever-madeleine-66f923.netlify.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn("❌ Blocked by CORS:", origin);
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// ✅ SAFE preflight handling (IMPORTANT FIX)
app.options(/.*/, cors());

// ✅ Proper preflight handling
app.options(/.*/, cors());
/* =========================================
   🔄 BODY PARSER
========================================= */
app.use(express.json());

/* =========================================
   🚫 CACHE CONTROL
========================================= */
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

/* =========================================
   🔥 HEALTH ROUTES
========================================= */

app.get("/", (req, res) => {
  res.send("🚀 Pharmacy Backend API Running...");
});

app.get("/test", (req, res) => {
  res.send("🔥 SERVER WORKING");
});

app.get("/api/auth/check", (req, res) => {
  res.send("🔥 AUTH ROUTE WORKING");
});

/* =========================================
   📦 ROUTES
========================================= */

const medicineRoutes = require("./routes/medicineRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const billRoutes = require("./routes/billRoutes");
const customerRoutes = require("./routes/customerRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reportRoutes = require("./routes/reportRoutes");
const authRoutes = require("./routes/authRoutes");

app.use("/api/medicines", medicineRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/auth", authRoutes);

/* =========================================
   ❌ 404 HANDLER
========================================= */
app.use((req, res) => {
  console.warn("❌ 404:", req.method, req.url);

  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`
  });
});

/* =========================================
   ❌ GLOBAL ERROR HANDLER
========================================= */
app.use((err, req, res, next) => {
  console.error("🔥 SERVER ERROR:", err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

/* =========================================
   🚀 START SERVER
========================================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});