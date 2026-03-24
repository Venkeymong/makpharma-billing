const Bill = require("../models/bill");
const Medicine = require("../models/medicine");

// 📊 DASHBOARD DATA
exports.getDashboard = async (req, res) => {
  try {

    const bills = await Bill.find();

    const totalRevenue = bills.reduce((sum, b) => sum + b.totalAmount, 0);

    const totalBills = bills.length;

    const today = new Date().toDateString();

    const todaySales = bills.filter(b =>
      new Date(b.createdAt).toDateString() === today
    );

    const todayRevenue = todaySales.reduce((sum, b) => sum + b.totalAmount, 0);

    // 🔥 LOW STOCK
    const lowStock = await Medicine.find({ stock: { $lt: 10 } });

    res.json({
      totalRevenue,
      totalBills,
      todayRevenue,
      todaySales: todaySales.length,
      lowStock
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};