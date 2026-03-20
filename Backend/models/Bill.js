const mongoose = require("mongoose");

const billSchema = new mongoose.Schema({

invoiceNo: String,
partyName: String,

// ✅ MULTIPLE ITEMS ARRAY
items: [
{
desc: String,
hsn: String,
qty: Number,
rate: Number,
amount: Number
}
],

total: Number,
gst: Number,
grandTotal: Number,

date: {
type: Date,
default: Date.now
}

});

module.exports = mongoose.model("Bill", billSchema);