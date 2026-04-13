const Bill = require("../models/bill");
const Medicine = require("../models/medicine");

/* =========================================
   📊 GET REPORT (PRODUCTION READY)
========================================= */

exports.getReport = async (req, res) => {
  try {

    const { type, startDate, endDate } = req.query;

    const bills = await Bill.find();
    const medicines = await Medicine.find();

    let filtered = [];

    const today = new Date();

    /* ================= FILTER LOGIC ================= */

    if (type === "daily") {

      filtered = bills.filter(b =>
        new Date(b.date || b.createdAt).toDateString() === today.toDateString()
      );

    } else if (type === "weekly") {

      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);

      filtered = bills.filter(b =>
        new Date(b.date || b.createdAt) >= weekAgo
      );

    } else if (type === "monthly") {

      filtered = bills.filter(b => {
        const d = new Date(b.date || b.createdAt);
        return (
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear()
        );
      });

    } else if (type === "custom") {

      if (!startDate || !endDate) {
        return res.status(400).json({
          message: "Start date and end date required for custom report"
        });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      filtered = bills.filter(b => {
        const d = new Date(b.date || b.createdAt);
        return d >= start && d <= end;
      });

    } else {
      // default → all
      filtered = bills;
    }

    /* ================= KPI ================= */

    const totalSales = filtered.reduce((sum, b) => {
      return sum + (b.totalAmount || 0);
    }, 0);

    const totalOrders = filtered.length;

    const avgOrderValue =
      totalOrders > 0 ? totalSales / totalOrders : 0;

    /* ================= STOCK ================= */

    const lowStock = medicines.filter(m => (m.stock || 0) < 10);

    const expirySoon = medicines.filter(m => {
      if (!m.expiry) return false;

      const days =
        (new Date(m.expiry) - today) / (1000 * 3600 * 24);

      return days <= 30 && days > 0;
    });

    const expired = medicines.filter(m => {
      if (!m.expiry) return false;
      return new Date(m.expiry) < today;
    });

    /* ================= RESPONSE ================= */

    res.json({
      invoices: filtered,
      totalSales,
      totalOrders,
      avgOrderValue,
      lowStock,
      expirySoon,
      expired
    });

  } catch (error) {

    console.error("❌ Report Error:", error);

    res.status(500).json({
      message: "Failed to generate report"
    });
  }
};