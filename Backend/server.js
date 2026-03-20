require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Model
const Bill = require("./models/Bill");

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// SAVE BILL
app.post("/save-bill", async (req, res) => {
  try {
    console.log("Incoming Data:", req.body);

    const bill = new Bill({
      invoiceNo: req.body.invoiceNo || "",
      items: req.body.items || [],
      total: Number(req.body.total) || 0,
      gst: Number(req.body.gst) || 0,
      grandTotal: Number(req.body.grandTotal) || 0
    });

    await bill.save();

    res.json({ message: "Bill saved successfully" });
  } catch (err) {
    console.log("ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET ALL BILLS
app.get("/bills", async (req, res) => {
  try {
    const bills = await Bill.find();
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE BILL
app.delete("/delete-bill/:id", async (req, res) => {
  try {
    await Bill.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});