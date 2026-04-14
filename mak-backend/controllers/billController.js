const mongoose = require("mongoose");
const Bill = require("../models/bill");
const Medicine = require("../models/medicine");

/* =========================================
   🧾 CREATE BILL
========================================= */

exports.createBill = async (req, res) => {

  const session = await mongoose.startSession();

  try {

    session.startTransaction();

    const year = new Date().getFullYear();

    const lastBill = await Bill.findOne({
      invoiceNumber: { $regex: `^MAK-${year}-` }
    })
      .sort({ createdAt: -1 })
      .session(session);

    let nextNumber = 1;

    if (lastBill?.invoiceNumber) {
      const parts = lastBill.invoiceNumber.split("-");
      const lastNumber = parseInt(parts[2]);
      if (!isNaN(lastNumber)) nextNumber = lastNumber + 1;
    }

    const invoiceNumber = `MAK-${year}-${String(nextNumber).padStart(4, "0")}`;

    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Items cannot be empty");
    }

    const normalize = (str) =>
      String(str || "").toLowerCase().replace(/\s+/g, "");

    const allMeds = await Medicine.find().session(session);

    const normalizedItems = items.map(item => {

      const price = Number(item.price || 0);
      const sellingPrice = Number(item.sellingPrice || price || 0);
      const qty = Number(item.qty || 0);
      const gst = Number(item.gst || 0);

      if (!item.medicine || qty <= 0) {
        throw new Error(`Invalid item: ${item.medicine}`);
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

    const bill = new Bill({
      ...req.body,
      items: normalizedItems,
      invoiceNumber
    });

    await bill.save({ session });

    /* 🔥 REDUCE STOCK */
    for (const item of normalizedItems) {

      const med = allMeds.find(m =>
        normalize(m.name) === normalize(item.medicine)
      );

      if (!med) {
        throw new Error(`Medicine not found: ${item.medicine}`);
      }

      if (med.stock < item.qty) {
        throw new Error(`Insufficient stock for ${item.medicine}`);
      }

      med.stock -= item.qty;
      await med.save({ session });
    }

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Bill created successfully",
      data: bill
    });

  } catch (error) {

    await session.abortTransaction();

    console.error("❌ CREATE BILL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create bill"
    });

  } finally {
    session.endSession();
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

    console.error("❌ GET BILLS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch bills"
    });
  }
};


/* =========================================
   ❌ DELETE BILL (RESTORE STOCK)
========================================= */

exports.deleteBill = async (req, res) => {

  const session = await mongoose.startSession();

  try {

    session.startTransaction();

    const { id } = req.params;

    const bill = await Bill.findById(id).session(session);

    if (!bill) {
      throw new Error("Bill not found");
    }

    const normalize = (str) =>
      String(str || "").toLowerCase().replace(/\s+/g, "");

    const allMeds = await Medicine.find().session(session);

    /* 🔥 RESTORE STOCK */
    for (const item of bill.items) {

      const med = allMeds.find(m =>
        normalize(m.name) === normalize(item.medicine)
      );

      if (med) {
        med.stock += item.qty;
        await med.save({ session });
      }
    }

    await Bill.findByIdAndDelete(id).session(session);

    await session.commitTransaction();

    return res.json({
      success: true,
      message: "Bill deleted & stock restored"
    });

  } catch (error) {

    await session.abortTransaction();

    console.error("❌ DELETE BILL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete bill"
    });

  } finally {
    session.endSession();
  }
};


/* =========================================
   🔄 UPDATE BILL (🔥 FULL STOCK SAFE)
========================================= */

exports.updateBill = async (req, res) => {

  const session = await mongoose.startSession();

  try {

    session.startTransaction();

    const { id } = req.params;

    const oldBill = await Bill.findById(id).session(session);

    if (!oldBill) {
      throw new Error("Bill not found");
    }

    const normalize = (str) =>
      String(str || "").toLowerCase().replace(/\s+/g, "");

    const allMeds = await Medicine.find().session(session);

    /* 🔥 STEP 1: RESTORE OLD STOCK */
    for (const item of oldBill.items) {

      const med = allMeds.find(m =>
        normalize(m.name) === normalize(item.medicine)
      );

      if (med) {
        med.stock += item.qty;
        await med.save({ session });
      }
    }

    /* 🔥 STEP 2: VALIDATE + REDUCE NEW STOCK */
    const newItems = req.body.items || [];

    for (const item of newItems) {

      const med = allMeds.find(m =>
        normalize(m.name) === normalize(item.medicine)
      );

      if (!med) {
        throw new Error(`Medicine not found: ${item.medicine}`);
      }

      if (med.stock < item.qty) {
        throw new Error(`Insufficient stock for ${item.medicine}`);
      }

      med.stock -= item.qty;
      await med.save({ session });
    }

    /* 🔥 STEP 3: UPDATE BILL */
    const updated = await Bill.findByIdAndUpdate(
      id,
      req.body,
      { new: true, session }
    );

    await session.commitTransaction();

    return res.json({
      success: true,
      message: "Invoice updated successfully",
      data: updated
    });

  } catch (error) {

    await session.abortTransaction();

    console.error("❌ UPDATE BILL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update invoice"
    });

  } finally {
    session.endSession();
  }
};