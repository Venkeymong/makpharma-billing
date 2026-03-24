const Bill = require("../models/bill");
const Medicine = require("../models/Medicine");

exports.getReport = async (req, res) => {
  try {

    const { type, startDate, endDate } = req.query;

    const bills = await Bill.find();
    const medicines = await Medicine.find();

    let filtered = [];

    const today = new Date();

    if (type === 'daily') {
      filtered = bills.filter(b =>
        new Date(b.date).toDateString() === today.toDateString()
      );
    }

    else if (type === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);

      filtered = bills.filter(b =>
        new Date(b.date) >= weekAgo
      );
    }

    else if (type === 'monthly') {
      filtered = bills.filter(b => {
        const d = new Date(b.date);
        return d.getMonth() === today.getMonth() &&
               d.getFullYear() === today.getFullYear();
      });
    }

    else if (type === 'custom') {
      filtered = bills.filter(b => {
        const d = new Date(b.date);
        return d >= new Date(startDate) &&
               d <= new Date(endDate);
      });
    }

    // 🔥 KPI
    const totalSales = filtered.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalOrders = filtered.length;
    const avgOrderValue = totalOrders ? totalSales / totalOrders : 0;

    // 🔥 STOCK
    const lowStock = medicines.filter(m => m.stock < 10);

    const expirySoon = medicines.filter(m => {
      const days = (new Date(m.expiry) - today) / (1000 * 3600 * 24);
      return days <= 30 && days > 0;
    });

    const expired = medicines.filter(m =>
      new Date(m.expiry) < today
    );

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
    res.status(500).json({ message: error.message });
  }
};