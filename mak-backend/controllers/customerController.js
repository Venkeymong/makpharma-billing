const Customer = require("../models/customer");

/* =========================================
   ➕ ADD CUSTOMER
========================================= */

exports.addCustomer = async (req, res) => {
  try {

    const { name, phone } = req.body;

    /* 🔒 BASIC VALIDATION */
    if (!name || !phone) {
      return res.status(400).json({
        message: "Name and phone are required"
      });
    }

    const customer = new Customer(req.body);

    const saved = await customer.save();

    res.status(201).json(saved);

  } catch (error) {

    console.error("❌ Add Customer Error:", error);

    res.status(500).json({
      message: "Failed to add customer"
    });
  }
};


/* =========================================
   📥 GET ALL CUSTOMERS
========================================= */

exports.getCustomers = async (req, res) => {
  try {

    const data = await Customer.find().sort({ createdAt: -1 });

    res.json(data);

  } catch (error) {

    console.error("❌ Get Customers Error:", error);

    res.status(500).json({
      message: "Failed to fetch customers"
    });
  }
};


/* =========================================
   ✏️ UPDATE CUSTOMER
========================================= */

exports.updateCustomer = async (req, res) => {
  try {

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Invalid customer ID"
      });
    }

    const updated = await Customer.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    res.json(updated);

  } catch (error) {

    console.error("❌ Update Customer Error:", error);

    res.status(500).json({
      message: "Failed to update customer"
    });
  }
};


/* =========================================
   ❌ DELETE CUSTOMER
========================================= */

exports.deleteCustomer = async (req, res) => {
  try {

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Invalid customer ID"
      });
    }

    const deleted = await Customer.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    res.json({
      message: "Customer deleted successfully"
    });

  } catch (error) {

    console.error("❌ Delete Customer Error:", error);

    res.status(500).json({
      message: "Failed to delete customer"
    });
  }
};