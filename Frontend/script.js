const API_BASE_URL = "https://billing-portal-backend-yuvi.onrender.com";

function login() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;

  if (user === "SANJAYSARPANCH" && pass === "sanjay@123") {
    window.location.href = "bill.html";
  } else {
    alert("Invalid Username or Password");
  }
}

/* Enter key support */
document.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    login();
  }
});

// NAVIGATION
function goToHistory() {
  window.location.href = "history.html";
}

// NUMBER TO WORDS
function numberToWords(num) {
  const ones = [
    "", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
    "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN",
    "EIGHTEEN", "NINETEEN"
  ];

  const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

  num = Math.floor(num);

  if (num === 0) return "ZERO";

  if (num < 20) {
    return ones[num];
  }

  if (num < 100) {
    return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
  }

  if (num < 1000) {
    return ones[Math.floor(num / 100)] + " HUNDRED" + (num % 100 ? " " + numberToWords(num % 100) : "");
  }

  if (num < 100000) {
    return numberToWords(Math.floor(num / 1000)) + " THOUSAND" + (num % 1000 ? " " + numberToWords(num % 1000) : "");
  }

  if (num < 10000000) {
    return numberToWords(Math.floor(num / 100000)) + " LAKH" + (num % 100000 ? " " + numberToWords(num % 100000) : "");
  }

  if (num < 1000000000) {
    return numberToWords(Math.floor(num / 10000000)) + " CRORE" + (num % 10000000 ? " " + numberToWords(num % 10000000) : "");
  }

  return num.toString();
}

function amountInWords(amount) {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let words = numberToWords(rupees) + " RUPEES";

  if (paise > 0) {
    words += " AND " + numberToWords(paise) + " PAISE";
  }

  words += " ONLY";
  return words;
}

// GENERATE BILL
function generate() {
  let total = 0;

  const rows = document.querySelectorAll("#items tr");

  rows.forEach((row) => {
    const qtyInput = row.querySelector(".qty");
    const rateInput = row.querySelector(".rate");
    const amountCell = row.querySelector(".amount");

    const qty = Number(qtyInput.value);
    const rate = Number(rateInput.value);

    if (qty > 0 && rate > 0) {
      const amount = qty * rate;
      amountCell.innerText = amount.toFixed(2);
      total += amount;
    } else {
      amountCell.innerText = "";
    }
  });

  const taxType = document.getElementById("taxType").value;

  let sgst = 0;
  let cgst = 0;
  let igst = 0;
  let gsttotal = 0;

  if (taxType === "cgst_sgst") {
    sgst = total * 0.03;
    cgst = total * 0.03;
    gsttotal = sgst + cgst;

    document.getElementById("sgst").innerText = sgst.toFixed(2);
    document.getElementById("cgst").innerText = cgst.toFixed(2);
    document.getElementById("igst").innerText = "-";
  } else {
    igst = total * 0.06;
    gsttotal = igst;

    document.getElementById("sgst").innerText = "-";
    document.getElementById("cgst").innerText = "-";
    document.getElementById("igst").innerText = igst.toFixed(2);
  }

  const grand = total + gsttotal;

  document.getElementById("total").innerText = total.toFixed(2);
  document.getElementById("gsttotal").innerText = gsttotal.toFixed(2);
  document.getElementById("grand").innerText = grand.toFixed(2);
  document.getElementById("words").innerText = amountInWords(grand);
}

// SAVE BILL
function saveBill(total, gst, grand, taxType) {
  const invoiceNo = document.getElementById("invoice").value.trim();

  if (!invoiceNo) {
    alert("Please enter invoice number");
    return;
  }

  const rows = document.querySelectorAll("#items tr");
  const items = [];

  rows.forEach((row) => {
    const descInput = row.querySelector(".desc");
    const hsnInput = row.querySelector(".hsn");
    const qtyInput = row.querySelector(".qty");
    const rateInput = row.querySelector(".rate");

    const desc = descInput ? descInput.value.trim() : "";
    const hsn = hsnInput ? hsnInput.value.trim() : "";
    const qty = qtyInput ? Number(qtyInput.value) : 0;
    const rate = rateInput ? Number(rateInput.value) : 0;

    if (qty > 0 && rate > 0) {
      const amount = qty * rate;
      items.push({ desc, hsn, qty, rate, amount });
    }
  });

  if (items.length === 0) {
    alert("Please enter at least one valid item");
    return;
  }

  fetch(`${API_BASE_URL}/save-bill`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      invoiceNo,
      items,
      total,
      gst,
      grandTotal: grand,
      taxType
    })
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error("Failed to save bill");
      }
      return res.json();
    })
    .then((data) => {
      console.log("Saved ✅", data);
    })
    .catch((err) => {
      console.log("Save error:", err);
      alert("Bill save nahi hua. Backend check karo.");
    });
}

// FINAL BUTTON FUNCTION
function saveAndDownload() {
  generate();

  const total = Number(document.getElementById("total").innerText) || 0;
  const gst = Number(document.getElementById("gsttotal").innerText) || 0;
  const grand = Number(document.getElementById("grand").innerText) || 0;
  const taxType = document.getElementById("taxType").value;
  const invoiceNo = document.getElementById("invoice").value.trim();

  if (!invoiceNo) {
    alert("Please enter invoice number");
    return;
  }

  if (total <= 0) {
    alert("Please fill item quantity and rate properly");
    return;
  }

  saveBill(total, gst, grand, taxType);
  downloadPDF();
}

// ADD ROW
let count = 1;

function addRow() {
  if (count >= 8) {
    alert("Max 8 items allowed (1 page bill)");
    return;
  }

  count++;

  const row = `
    <tr>
      <td>${count}</td>
      <td><input class="desc"></td>
      <td><input class="hsn"></td>
      <td><input class="qty" type="number"></td>
      <td><input class="rate" type="number"></td>
      <td class="amount"></td>
    </tr>
  `;

  document.getElementById("items").insertAdjacentHTML("beforeend", row);
}

// AUTO CALCULATION
document.addEventListener("input", function (e) {
  if (
    e.target.classList.contains("qty") ||
    e.target.classList.contains("rate")
  ) {
    generate();
  }
});

document.addEventListener("change", function (e) {
  if (e.target.id === "taxType") {
    generate();
  }
});

// PDF DOWNLOAD
function downloadPDF() {
  const element = document.querySelector(".invoice");
  const invoiceNo = document.getElementById("invoice").value.trim() || "bill";

  const opt = {
    margin: 5,
    filename: `Invoice_${invoiceNo}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
  };

  html2pdf().set(opt).from(element).save();
}