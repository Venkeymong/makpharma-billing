const Purchase = require("../models/purchase");
const Medicine = require("../models/Medicine");

// ➕ ADD PURCHASE
exports.addPurchase = async (req, res) => {
  try {
    const purchase = new Purchase(req.body);
    await purchase.save();

    // 🔥 Update stock
    for (let item of req.body.items) {
      await Medicine.updateOne(
        { name: item.medicine },
        { $inc: { stock: item.qty } }
      );
    }

    res.json(purchase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📥 GET PURCHASES
exports.getPurchases = async (req, res) => {
  try {
    const data = await Purchase.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ❌ DELETE
exports.deletePurchase = async (req, res) => {
  try {
    await Purchase.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};