const Bill = require("../models/bill");
const Medicine = require("../models/medicine");

/* =========================================
   📊 DASHBOARD DATA (OPTIMIZED PRO VERSION)
========================================= */

exports.getDashboard = async (req, res) => {
  try {

    /* ================= TOTAL REVENUE ================= */

    const revenueData = await Bill.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalBills: { $sum: 1 }
        }
      }
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;
    const totalBills = revenueData[0]?.totalBills || 0;

    /* ================= TODAY SALES ================= */

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayData = await Bill.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: null,
          todayRevenue: { $sum: "$totalAmount" },
          todaySales: { $sum: 1 }
        }
      }
    ]);

    const todayRevenue = todayData[0]?.todayRevenue || 0;
    const todaySales = todayData[0]?.todaySales || 0;

    /* ================= LOW STOCK ================= */

    const lowStock = await Medicine.find({
      stock: { $lt: 10 }
    })
      .sort({ stock: 1 })
      .limit(10); // 🔥 limit for performance

    /* ================= RESPONSE ================= */

    return res.json({
      success: true,
      data: {
        totalRevenue,
        totalBills,
        todayRevenue,
        todaySales,
        lowStock
      }
    });

  } catch (error) {

    console.error("❌ Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load dashboard"
    });
  }
};