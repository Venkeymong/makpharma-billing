const mongoose = require("mongoose");
const Bill = require("../models/bill");
const Medicine = require("../models/medicine");

/* =========================================
   🧾 CREATE BILL (PRODUCTION SAFE)
========================================= */

exports.createBill = async (req, res) => {

  const session = await mongoose.startSession();

  try {

    session.startTransaction();

    const year = new Date().getFullYear();

    /* ================= INVOICE GENERATION ================= */

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

    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Items cannot be empty");
    }

    /* ================= NORMALIZE ITEMS ================= */

    const normalizedItems = items.map(item => {

      if (!item.medicine || !item.qty) {
        throw new Error("Invalid item data");
      }

      const price = Number(item.price || 0);
      const sellingPrice = Number(item.sellingPrice || price || 0);
      const qty = Number(item.qty || 0);
      const gst = Number(item.gst || 0);

      if (qty <= 0) {
        throw new Error(`Invalid quantity for ${item.medicine}`);
      }

      return {
        medicine: item.medicine,
        batch: item.batch || "",
        qty,
        price,
        sellingPrice,
        gst,
        total: qty * sellingPrice
      };
    });

    /* ================= CREATE BILL ================= */

    const bill = new Bill({
      ...req.body,
      items: normalizedItems,
      invoiceNumber
    });

    await bill.save({ session });

    /* ================= STOCK REDUCTION ================= */

    for (const item of normalizedItems) {

      const med = await Medicine.findOne({
        name: item.medicine,
        batch: item.batch || undefined
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

    res.status(201).json({
      success: true,
      message: "Bill created successfully",
      data: bill
    });

  } catch (error) {

    await session.abortTransaction();
    session.endSession();

    console.error("❌ Create Bill Error:", error.message);

    res.status(500).json({
      success: false,
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

    res.json({
      success: true,
      data: bills
    });

  } catch (error) {
    console.error("❌ Get Bills Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch bills"
    });
  }
};


/* =========================================
   ❌ DELETE BILL (SAFE + RESTORE STOCK)
========================================= */

exports.deleteBill = async (req, res) => {
  try {

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid bill ID"
      });
    }

    const bill = await Bill.findById(id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found"
      });
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

    res.json({
      success: true,
      message: "Bill deleted & stock restored"
    });

  } catch (error) {

    console.error("❌ Delete Bill Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to delete bill"
    });
  }
};