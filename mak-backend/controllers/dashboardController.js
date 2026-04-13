const Bill = require("../models/bill");
const Medicine = require("../models/medicine");

/* =========================================
   📊 DASHBOARD DATA (PRODUCTION READY)
========================================= */

exports.getDashboard = async (req, res) => {
  try {

    /* ================= FETCH DATA ================= */

    const bills = await Bill.find();

    /* ================= TOTAL REVENUE ================= */

    const totalRevenue = bills.reduce((sum, b) => {
      return sum + (b.totalAmount || 0);
    }, 0);

    const totalBills = bills.length;

    /* ================= TODAY SALES ================= */

    const today = new Date().toDateString();

    const todaySalesList = bills.filter(b => {
      return new Date(b.createdAt).toDateString() === today;
    });

    const todayRevenue = todaySalesList.reduce((sum, b) => {
      return sum + (b.totalAmount || 0);
    }, 0);

    /* ================= LOW STOCK ================= */

    const lowStock = await Medicine.find({
      stock: { $lt: 10 }
    }).sort({ stock: 1 });

    /* ================= RESPONSE ================= */

    res.json({
      totalRevenue,
      totalBills,
      todayRevenue,
      todaySales: todaySalesList.length,
      lowStock
    });

  } catch (error) {

    console.error("❌ Dashboard Error:", error);

    res.status(500).json({
      message: "Failed to load dashboard"
    });
  }
};