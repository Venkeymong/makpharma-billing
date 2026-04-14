const mongoose = require("mongoose");
const Bill = require("../models/bill");
const Medicine = require("../models/medicine");

/* =========================================
   🧾 CREATE BILL (SAFE + STABLE)
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
      const parts = lastBill.invoiceNumber.split("-");
      const lastNumber = parseInt(parts[2]);

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

    /* ================= NORMALIZE ================= */

    const normalize = (str) =>
      String(str || "").toLowerCase().replace(/\s+/g, "");

    const allMeds = await Medicine.find().session(session);

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
        medicine: item.medicine.trim(),
        batch: item.batch?.trim() || "",
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

      /* 🔥 FINAL FIX: NORMALIZED MATCH */
      const med = allMeds.find(m =>
        normalize(m.name) === normalize(item.medicine)
      );

      if (!med) {
        throw new Error(`Medicine not found: ${item.medicine}`);
      }

      /* 🔒 SAFE NUMBERS */
      med.price = Number(med.price || item.price || 0);
      med.sellingPrice = Number(med.sellingPrice || item.sellingPrice || med.price || 0);
      med.stock = Number(med.stock || 0);

      if (med.stock < item.qty) {
        throw new Error(`Insufficient stock for ${item.medicine}`);
      }

      med.stock -= item.qty;

      await med.save({ session });
    }

    /* ================= COMMIT ================= */

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: "Bill created successfully",
      data: bill
    });

  } catch (error) {

    await session.abortTransaction();
    session.endSession();

    console.error("❌ FULL ERROR:", error.message);

    return res.status(500).json({
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

    return res.json({
      success: true,
      data: bills
    });

  } catch (error) {

    console.error("❌ Get Bills Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch bills"
    });
  }
};


/* =========================================
   ❌ DELETE BILL (SAFE)
========================================= */

exports.deleteBill = async (req, res) => {

  const session = await mongoose.startSession();

  try {

    session.startTransaction();

    const { id } = req.params;

    if (!id) {
      throw new Error("Invalid bill ID");
    }

    const bill = await Bill.findById(id).session(session);

    if (!bill) {
      throw new Error("Bill not found");
    }

    const normalize = (str) =>
      String(str || "").toLowerCase().replace(/\s+/g, "");

    const allMeds = await Medicine.find().session(session);

    /* ================= RESTORE STOCK ================= */

    for (const item of bill.items) {

      const med = allMeds.find(m =>
        normalize(m.name) === normalize(item.medicine)
      );

      if (med) {

        med.price = Number(med.price || 0);
        med.sellingPrice = Number(med.sellingPrice || 0);
        med.stock = Number(med.stock || 0);

        med.stock += item.qty;

        await med.save({ session });
      }
    }

    await Bill.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    session.endSession();

    return res.json({
      success: true,
      message: "Bill deleted & stock restored"
    });

  } catch (error) {

    await session.abortTransaction();
    session.endSession();

    console.error("❌ Delete Bill Error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete bill"
    });
  }
};