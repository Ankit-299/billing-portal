const API_BASE_URL = "https://billing-portal-backend-yuvi.onrender.com";

// LOGIN
function login() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;

  if (user === "SANJAYSARPANCH" && pass === "sanjay@123") {
    window.location.href = "bill.html";
  } else {
    alert("Invalid Username or Password");
  }
}

// ENTER KEY LOGIN
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
  const ones = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
    "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN",
    "EIGHTEEN", "NINETEEN"];

  const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

  num = Math.floor(num);

  if (num === 0) return "ZERO";
  if (num < 20) return ones[num];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
  if (num < 1000) return ones[Math.floor(num / 100)] + " HUNDRED" + (num % 100 ? " " + numberToWords(num % 100) : "");
  if (num < 100000) return numberToWords(Math.floor(num / 1000)) + " THOUSAND" + (num % 1000 ? " " + numberToWords(num % 1000) : "");
  if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + " LAKH" + (num % 100000 ? " " + numberToWords(num % 100000) : "");
  if (num < 1000000000) return numberToWords(Math.floor(num / 10000000)) + " CRORE" + (num % 10000000 ? " " + numberToWords(num % 10000000) : "");

  return num.toString();
}

function amountInWords(amount) {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let words = numberToWords(rupees) + " RUPEES";

  if (paise > 0) {
    words += " AND " + numberToWords(paise) + " PAISE";
  }

  return words + " ONLY";
}

// GENERATE BILL
function generate() {
  let total = 0;
  const rows = document.querySelectorAll("#items tr");

  rows.forEach((row) => {
    const qty = Number(row.querySelector(".qty")?.value) || 0;
    const rate = Number(row.querySelector(".rate")?.value) || 0;
    const amountCell = row.querySelector(".amount");

    if (qty > 0 && rate > 0) {
      const amount = qty * rate;
      amountCell.innerText = amount.toFixed(2);
      total += amount;
    } else {
      amountCell.innerText = "";
    }
  });

  const taxType = document.getElementById("taxType").value;

  let sgst = 0, cgst = 0, igst = 0;

  if (taxType === "cgst_sgst") {
    sgst = total * 0.03;
    cgst = total * 0.03;

    document.getElementById("sgst").innerText = sgst.toFixed(2);
    document.getElementById("cgst").innerText = cgst.toFixed(2);
    document.getElementById("igst").innerText = "-";
  } else {
    igst = total * 0.06;

    document.getElementById("sgst").innerText = "-";
    document.getElementById("cgst").innerText = "-";
    document.getElementById("igst").innerText = igst.toFixed(2);
  }

  const gsttotal = sgst + cgst + igst;
  const grand = total + gsttotal;

  document.getElementById("total").innerText = total.toFixed(2);
  document.getElementById("gsttotal").innerText = gsttotal.toFixed(2);
  document.getElementById("grand").innerText = grand.toFixed(2);
  document.getElementById("words").innerText = amountInWords(grand);
}

// SAVE BILL (FIXED)
function saveBill(total, gst, grand) {
  const invoiceNo = document.getElementById("invoice").value.trim();

  if (!invoiceNo) {
    alert("Please enter invoice number");
    return Promise.reject();
  }

  const rows = document.querySelectorAll("#items tr");
  const items = [];

  rows.forEach((row) => {
    const desc = row.querySelector(".desc")?.value.trim() || "";
    const hsn = row.querySelector(".hsn")?.value.trim() || "";
    const qty = Number(row.querySelector(".qty")?.value) || 0;
    const rate = Number(row.querySelector(".rate")?.value) || 0;

    if (qty > 0 && rate > 0) {
      items.push({ desc, hsn, qty, rate, amount: qty * rate });
    }
  });

  if (items.length === 0) {
    alert("Please enter at least one valid item");
    return Promise.reject();
  }

  // ✅ IMPORTANT FIX
  return fetch(`${API_BASE_URL}/save-bill`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      invoiceNo,
      items,
      total,
      gst,
      grandTotal: grand
    })
  })
    .then(res => {
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    })
    .then(data => {
      console.log("Saved ✅", data);
    })
    .catch(err => {
      console.log("Save error:", err);
      alert("Bill save nahi hua. Backend check karo.");
    });
}

// FINAL BUTTON (FIXED)
async function saveAndDownload() {
  generate();

  const total = Number(document.getElementById("total").innerText) || 0;
  const gst = Number(document.getElementById("gsttotal").innerText) || 0;
  const grand = Number(document.getElementById("grand").innerText) || 0;
  const invoiceNo = document.getElementById("invoice").value.trim();

  if (!invoiceNo) {
    alert("Please enter invoice number");
    return;
  }

  if (total <= 0) {
    alert("Please fill item properly");
    return;
  }

  // ✅ WAIT FOR SAVE
  await saveBill(total, gst, grand);

  // ✅ THEN DOWNLOAD
  downloadPDF();
}

// ADD ROW
let count = 1;

function addRow() {
  if (count >= 8) {
    alert("Max 8 items allowed");
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

// AUTO CALC
document.addEventListener("input", (e) => {
  if (e.target.classList.contains("qty") || e.target.classList.contains("rate")) {
    generate();
  }
});

document.addEventListener("change", (e) => {
  if (e.target.id === "taxType") {
    generate();
  }
});
function printBill() {
  const buttons = document.querySelector(".buttons");
  buttons.style.display = "none";

  window.print();

  setTimeout(() => {
    buttons.style.display = "block";
  }, 1000);
}
function saveAndPrint() {
  generate();

  const total = Number(document.getElementById("total").innerText) || 0;
  const gst = Number(document.getElementById("gsttotal").innerText) || 0;
  const grand = Number(document.getElementById("grand").innerText) || 0;

  saveBill(total, gst, grand); // backend save

  setTimeout(() => {
    printBill(); // print
  }, 500);
}