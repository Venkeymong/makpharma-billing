const mongoose = require("mongoose");
const Bill = require("../models/bill");
const Medicine = require("../models/Medicine");

/* ================= CREATE BILL ================= */

exports.createBill = async (req, res) => {

  const session = await mongoose.startSession();
  session.startTransaction();

  try {

    const year = new Date().getFullYear();

    // 🔥 LOCK + GET LAST BILL (prevents duplicate invoice)
    const lastBill = await Bill.findOne({
      invoiceNumber: { $regex: `^MAK-${year}-` }
    })
    .sort({ createdAt: -1 })
    .session(session);

    let nextNumber = 1;

    if (lastBill && lastBill.invoiceNumber) {

      const lastPart = lastBill.invoiceNumber.split('-')[2];
      const lastNumber = parseInt(lastPart);

      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const paddedNumber = String(nextNumber).padStart(4, '0');
    const invoiceNumber = `MAK-${year}-${paddedNumber}`;

    /* ================= VALIDATION ================= */

    if (!req.body.items || !req.body.items.length) {
      throw new Error("Items cannot be empty");
    }

    /* ================= CREATE BILL ================= */

    const bill = new Bill({
      ...req.body,
      invoiceNumber
    });

    await bill.save({ session });

    /* ================= STOCK REDUCTION ================= */

    for (let item of req.body.items) {

      const med = await Medicine.findOne({ name: item.medicine }).session(session);

      if (!med) {
        throw new Error(`Medicine not found: ${item.medicine}`);
      }

      if (med.stock < item.qty) {
        throw new Error(`Insufficient stock for ${item.medicine}`);
      }

      med.stock -= item.qty;
      await med.save({ session });
    }

    /* ================= COMMIT ================= */

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(bill);

  } catch (error) {

    await session.abortTransaction();
    session.endSession();

    console.error("Create Bill Error:", error);

    res.status(500).json({
      message: error.message || "Failed to create bill"
    });
  }
};

/* ================= GET ALL BILLS ================= */

exports.getBills = async (req, res) => {
  try {

    const bills = await Bill.find().sort({ createdAt: -1 });

    res.json(bills);

  } catch (error) {
    console.error("Get Bills Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ================= DELETE BILL ================= */

exports.deleteBill = async (req, res) => {
  try {

    const id = req.params.id;

    if (!id) {
      return res.status(400).json({ message: "Invalid bill ID" });
    }

    const bill = await Bill.findById(id);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    // 🔥 RESTORE STOCK WHEN DELETING
    for (let item of bill.items) {
      await Medicine.updateOne(
        { name: item.medicine },
        { $inc: { stock: item.qty } }
      );
    }

    await Bill.findByIdAndDelete(id);

    res.json({ message: "Bill deleted & stock restored" });

  } catch (error) {
    console.error("Delete Bill Error:", error);
    res.status(500).json({ message: error.message });
  }
};