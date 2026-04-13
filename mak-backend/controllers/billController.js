const mongoose = require("mongoose");
const Bill = require("../models/bill");
const Medicine = require("../models/medicine");

/* =========================================
   🧾 CREATE BILL (PRODUCTION READY)
========================================= */

exports.createBill = async (req, res) => {

  const session = await mongoose.startSession();
  session.startTransaction();

  try {

    const year = new Date().getFullYear();

    /* ================= GET LAST INVOICE ================= */

    const lastBill = await Bill.findOne({
      invoiceNumber: { $regex: `^MAK-${year}-` }
    })
      .sort({ createdAt: -1 })
      .session(session);

    let nextNumber = 1;

    if (lastBill?.invoiceNumber) {
      const lastPart = lastBill.invoiceNumber.split("-")[2];
      const lastNumber = parseInt(lastPart);

      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const invoiceNumber = `MAK-${year}-${String(nextNumber).padStart(4, "0")}`;

    /* ================= VALIDATION ================= */

    if (!req.body.items || !Array.isArray(req.body.items) || !req.body.items.length) {
      throw new Error("Items cannot be empty");
    }

    /* ================= CREATE BILL ================= */

    const bill = new Bill({
      ...req.body,
      invoiceNumber
    });

    await bill.save({ session });

    /* ================= STOCK REDUCTION ================= */

    for (const item of req.body.items) {

      const med = await Medicine.findOne({
        name: item.medicine,
        batch: item.batch || undefined // 🔥 supports batch
      }).session(session);

      if (!med) {
        throw new Error(`Medicine not found: ${item.medicine}`);
      }

      if ((med.stock || 0) < item.qty) {
        throw new Error(`Insufficient stock for ${item.medicine}`);
      }

      med.stock = (med.stock || 0) - item.qty;

      await med.save({ session });
    }

    /* ================= COMMIT ================= */

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(bill);

  } catch (error) {

    await session.abortTransaction();
    session.endSession();

    console.error("❌ Create Bill Error:", error);

    res.status(500).json({
      message: error.message || "Failed to create bill"
    });
  }
};


/* =========================================
   📥 GET ALL BILLS
========================================= */

exports.getBills = async (req, res) => {
  try {

    const bills = await Bill.find().sort({ createdAt: -1 });

    res.json(bills);

  } catch (error) {
    console.error("❌ Get Bills Error:", error);
    res.status(500).json({ message: "Failed to fetch bills" });
  }
};


/* =========================================
   ❌ DELETE BILL (WITH STOCK RESTORE)
========================================= */

exports.deleteBill = async (req, res) => {
  try {

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Invalid bill ID" });
    }

    const bill = await Bill.findById(id);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    /* ================= RESTORE STOCK ================= */

    for (const item of bill.items) {

      await Medicine.updateOne(
        {
          name: item.medicine,
          batch: item.batch || undefined
        },
        {
          $inc: { stock: item.qty }
        }
      );
    }

    await Bill.findByIdAndDelete(id);

    res.json({ message: "Bill deleted & stock restored" });

  } catch (error) {
    console.error("❌ Delete Bill Error:", error);
    res.status(500).json({ message: "Failed to delete bill" });
  }
};