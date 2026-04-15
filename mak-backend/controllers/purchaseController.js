const Purchase = require("../models/purchase");
const Medicine = require("../models/medicine");


/* =========================================
   ➕ ADD PURCHASE (SYNC WITH MEDICINE)
========================================= */

exports.addPurchase = async (req, res) => {
  try {

    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Purchase items required"
      });
    }

    console.log("📥 Purchase Incoming:", req.body);

    /* ✅ SAVE PURCHASE FIRST */
    const purchase = new Purchase(req.body);
    await purchase.save();


    /* 🔥 SYNC WITH MEDICINE COLLECTION */

    for (const item of items) {

      try {

        const name = item.medicine?.trim();
        const batch = item.batch?.trim() || "";

        const qty = Number(item.qty) || 0;
        const price = Number(item.price) || 0;
        const sellingPrice = Number(item.sellingPrice) || price;
        const gst = Number(item.gst) || 0;

        let med = await Medicine.findOne({ name, batch });

        if (med) {

          /* ✅ UPDATE EXISTING */

          med.stock = (med.stock || 0) + qty;

          med.price = price || med.price;
          med.sellingPrice = sellingPrice || med.sellingPrice;

          if (item.hsn) med.hsn = item.hsn;
          if (item.expiry) med.expiry = item.expiry;
          if (item.gst != null) med.gst = gst;

          await med.save();

          console.log(`✅ Updated medicine: ${name}`);

        } else {

          /* ✅ CREATE NEW */

          await Medicine.create({
            name,
            batch,
            hsn: item.hsn || "",
            expiry: item.expiry || "",
            price: price,
            sellingPrice: sellingPrice,
            gst: gst,
            stock: qty
          });

          console.log(`🆕 Created medicine: ${name}`);
        }

      } catch (itemError) {
        console.error("❌ Item Processing Error:", itemError.message);
      }
    }

    return res.status(201).json({
      message: "Purchase added successfully",
      purchase
    });

  } catch (error) {

    console.error("❌ Add Purchase Error:", error.message);

    return res.status(500).json({
      message: error.message || "Failed to add purchase"
    });
  }
};


/* =========================================
   📥 GET PURCHASES
========================================= */

exports.getPurchases = async (req, res) => {
  try {

    const data = await Purchase.find()
      .sort({ createdAt: -1 });

    return res.json(data);

  } catch (error) {

    console.error("❌ Get Purchase Error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch purchases"
    });
  }
};


/* =========================================
   ❌ DELETE PURCHASE (RESTORE STOCK)
========================================= */

exports.deletePurchase = async (req, res) => {
  try {

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Invalid purchase ID"
      });
    }

    const purchase = await Purchase.findById(id);

    if (!purchase) {
      return res.status(404).json({
        message: "Purchase not found"
      });
    }

    /* 🔥 RESTORE STOCK */

    for (const item of purchase.items) {

      try {

        const name = item.medicine?.trim();
        const batch = item.batch?.trim() || "";

        const qty = Number(item.qty) || 0;

        const med = await Medicine.findOne({ name, batch });

        if (med) {
          med.stock = Math.max((med.stock || 0) - qty, 0);
          await med.save();

          console.log(`🔄 Restored stock: ${name}`);
        }

      } catch (itemError) {
        console.error("❌ Restore Item Error:", itemError.message);
      }
    }

    await Purchase.findByIdAndDelete(id);

    return res.json({
      message: "Purchase deleted & stock restored"
    });

  } catch (error) {

    console.error("❌ Delete Purchase Error:", error.message);

    return res.status(500).json({
      message: "Failed to delete purchase"
    });
  }
};