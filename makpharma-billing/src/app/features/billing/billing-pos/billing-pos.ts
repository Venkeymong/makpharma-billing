

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { MedicineService } from '../../../services/medicine';
import { CustomerService } from '../../../services/customer';
import { SalesService } from '../../../services/sales';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-billing-pos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './billing-pos.html',
  styleUrl: './billing-pos.css'
})
export class BillingPos implements OnInit {

  /* ================= MASTER DATA ================= */

  medicines: any[] = [];
  customers: any[] = [];

  filteredMedicines: any[] = [];
  filteredCustomers: any[] = [];

  cart: any[] = [];

  /* ================= SEARCH ================= */

  searchText = '';
  customerSearch = '';

  /* ================= TOTALS ================= */

  subtotal = 0;
  cgstTotal = 0;
  sgstTotal = 0;
  igstTotal = 0;
  discountTotal = 0;
  roundOff = 0;
  grandTotal = 0;

  /* ================= DISCOUNT ================= */

  discountType: 'percent' | 'amount' = 'amount';
  discountValue = 0;

  /* ================= INVOICE ================= */

  invoiceNumber = '';
  currentDate = new Date();

  customer = {
    name: '',
    phone: '',
    state: 'Tamil Nadu'
  };

  constructor(
    private medicineService: MedicineService,
    private customerService: CustomerService,
    private salesService: SalesService,
    private router: Router
  ) {}

  /* ================= INIT ================= */

  ngOnInit(): void {

    this.medicineService.medicines$.subscribe(data => {
      this.medicines = data;
    });

    this.customerService.customers$.subscribe(data => {
      this.customers = data;
    });

    this.generateInvoiceNumber();
  }

  /* ================= INVOICE ================= */

  generateInvoiceNumber(): void {
    const year = new Date().getFullYear();
    const count = this.salesService.getInvoices().length + 1;
    this.invoiceNumber = `MAK-${year}-${count.toString().padStart(4, '0')}`;
  }

  /* ================= SEARCH ================= */

  searchMedicine(): void {
    const text = this.searchText.toLowerCase();

    if (text.length < 2) {
      this.filteredMedicines = [];
      return;
    }

    this.filteredMedicines = this.medicines.filter(m =>
      m.name.toLowerCase().includes(text)
    );
  }

  searchCustomer(): void {
    const text = this.customerSearch.toLowerCase();

    this.filteredCustomers = this.customers.filter(c =>
      c.name.toLowerCase().includes(text) ||
      c.phone.includes(text)
    );
  }

  selectCustomer(c: any): void {
    this.customer = {
      name: c.name,
      phone: c.phone,
      state: c.state || 'Tamil Nadu'
    };

    this.customerSearch = c.name;
    this.filteredCustomers = [];
    this.updateTotals();
  }

  addCustomer(): void {
    this.router.navigate(['/customers'], { queryParams: { action: 'add' } });
  }

  /* ================= CART ================= */

  addToCart(med: any): void {

    if (med.stock <= 0) {
      alert("Out of stock");
      return;
    }

    const price = med.sellingPrice || med.price;
    const existing = this.cart.find(item => item.name === med.name);

    if (existing) {

      if (existing.qty < med.stock) {
        existing.qty++;
      } else {
        alert("Stock limit reached");
      }

    } else {

     this.cart.push({
  name: med.name,
  hsn: med.hsn,
  batch: med.batch, // 🔥 IMPORTANT

  price: med.price,                 // 💰 purchase price (hidden)
  sellingPrice: med.sellingPrice,   // 💰 customer price

  gst: med.gst,
  qty: 1
});

    }

    this.updateTotals();
  }

  increaseQty(item: any): void {
    const med = this.medicines.find(m => m.name === item.name);

    if (med && item.qty < med.stock) {
      item.qty++;
    } else {
      alert("No more stock available");
    }

    this.updateTotals();
  }

  decreaseQty(item: any): void {
    if (item.qty > 1) {
      item.qty--;
      this.updateTotals();
    }
  }

  /* ================= CALCULATION ================= */

  updateTotals(): void {

    let subtotal = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    for (let item of this.cart) {

     const base = item.qty * item.sellingPrice;
      const gstAmount = (base * item.gst) / 100;

      subtotal += base;

      if (this.customer.state === 'Tamil Nadu') {
        cgst += gstAmount / 2;
        sgst += gstAmount / 2;
      } else {
        igst += gstAmount;
      }
    }

    this.subtotal = subtotal;
    this.cgstTotal = cgst;
    this.sgstTotal = sgst;
    this.igstTotal = igst;

    let discount = this.discountType === 'percent'
      ? (subtotal * this.discountValue) / 100
      : this.discountValue;

    this.discountTotal = discount;

    const total = subtotal + cgst + sgst + igst - discount;
    const rounded = Math.round(total);

    this.roundOff = Number((rounded - total).toFixed(2));
    this.grandTotal = rounded;
  }
  paymentMethod: string = 'Cash'; // default selected

isPrinted = false;

printBill(): void {

  /* ================= VALIDATION ================= */

  if (!this.customer.name) {
    alert("Please select customer");
    return;
  }

  if (this.cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  if (this.isPrinted) {
    alert("⚠️ Bill already generated!");
    return;
  }

  /* ================= CONFIRMATION ================= */

  const confirmPrint = confirm("Do you want to generate and print this bill?");

  if (!confirmPrint) return;

  /* ================= CALCULATE WORDS ================= */

  const amountWords = this.numberToWords(this.grandTotal) + " Only";

  /* ================= LOGO ================= */

  const logo = window.location.origin + "/assets/makpharma.png";

  /* ================= SAVE INVOICE ================= */

this.salesService.addInvoice({
  invoiceNumber: this.invoiceNumber,

  customerName: this.customer.name,
  customerPhone: this.customer.phone,
  customerState: this.customer.state || 'Tamil Nadu',
  customerGST: '',

  totalAmount: this.grandTotal,

items: this.cart.map(item => ({
  medicine: item.name || item.medicine, // ✅ FIX
  batch: item.batch || '',
  qty: item.qty,

  price: item.price || 0,
  sellingPrice: item.sellingPrice || item.price || 0,

  gst: item.gst || 0,
  total: item.qty * (item.sellingPrice || item.price || 0)
})),

  date: new Date(),
  paymentMethod: this.paymentMethod
}).subscribe({
  next: () => console.log("✅ BILL SUCCESS"),
  error: (err) => console.error("❌ BILL ERROR:", err)
});

  /* ================= REDUCE STOCK (SAFE) ================= */

  this.cart.forEach(item => {
    this.medicineService.reduceStock(item.name, item.qty);
  });

  /* ================= LOCK PRINT ================= */

  this.isPrinted = true;

  /* ================= OPEN PRINT WINDOW ================= */

  const popup = window.open('', '', 'width=1000,height=900');

  if (!popup) {
    alert("Popup blocked! Please allow popups.");
    return;
  }
popup.document.write(`
<html>
<head>
<title>Invoice</title>

<style>
@page {
  size: A4;
  margin: 0;
}

body {
  margin: 0;
  padding: 10px;
  background: #fff;
  font-family: 'Segoe UI', Arial;
}

/* 🔥 PAGE */
.page {
  position: relative;

  width: calc(100% - 20px);
  height: calc(297mm - 20px);

  border: 2px solid #000;

  padding: 8mm;
  box-sizing: border-box;

  margin: auto;

  display: flex;
  flex-direction: column;
}

/* 🔥 WATERMARK */
.watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 420px;
  opacity: 0.06;
  z-index: 0;
}

/* CONTENT ABOVE */
.page > *:not(.watermark) {
  position: relative;
  z-index: 2;
}

/* 🔥 CONTENT WRAPPER */
.content {
  flex: 1;
}

/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #000;
  padding-bottom: 10px;
}

.logo { height: 70px; }

.company {
  font-size: 14px;
  line-height: 1.4;
}

.title {
  font-size: 26px;
  font-weight: bold;
}

/* INFO */
.info {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  border-bottom: 1px solid #000;
  padding-bottom: 8px;
  font-size: 13px;
}

/* TABLE */
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

th {
  background: #f1f5f9;
  font-size: 13px;
}

th, td {
  border: 1px solid #000;
  padding: 6px;
  text-align: center;
  font-size: 12px;
}

td.left {
  text-align: left;
}

/* TOTAL */
.totals {
  width: 280px;
  margin-left: auto;
  margin-top: 12px;
  border: 1px solid #000;
}

.row {
  display: flex;
  justify-content: space-between;
  padding: 6px 10px;
  border-bottom: 1px solid #ddd;
}

.row:last-child {
  border-bottom: none;
}

.grand {
  font-weight: bold;
  background: #f1f5f9;
}

/* WORDS */
.words {
  margin-top: 12px;
  border-top: 1px dashed #000;
  padding-top: 6px;
  font-size: 13px;
}

/* FOOTER */
.footer {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.signature {
  border-top: 1px solid #000;
  width: 200px;
  text-align: center;
  padding-top: 5px;
}

</style>
</head>

<body onload="setTimeout(()=>{window.print();window.close();},300)">

<div class="page">

  <img src="${logo}" class="watermark" />

  <div class="content">

    <!-- HEADER -->
    <div class="header">
      <img src="${logo}" class="logo"/>

      <div class="company">
        <strong>MAK PHARMA</strong><br>
        Chennai - 600037<br>
        Phone: 9092700152
      </div>

      <div class="title">TAX INVOICE</div>
    </div>

    <!-- INFO -->
    <div class="info">
      <div>
        <strong>Invoice No:</strong> ${this.invoiceNumber}<br>
        <strong>Date:</strong> ${new Date().toLocaleDateString()}
      </div>

      <div>
        <strong>Bill To:</strong><br>
        ${this.customer.name}<br>
        ${this.customer.phone}
      </div>
    </div>

    <!-- TABLE -->
    <table>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th>Rate</th>
        <th>Qty</th>
        <th>GST%</th>
        <th>Amount</th>
      </tr>

      ${this.cart.map((item:any,i:number)=>`
      <tr>
        <td>${i+1}</td>
        <td class="left">${item.name}</td>
        <td>${(item.sellingPrice || item.price).toFixed(2)}</td>
        <td>${item.qty}</td>
        <td>${item.gst}%</td>
        <td>${(item.qty * (item.sellingPrice || item.price)).toFixed(2)}</td>
      </tr>
      `).join('')}
    </table>

    <!-- TOTAL -->
    <div class="totals">

      <div class="row">
        <span>Subtotal</span>
        <span>₹${this.subtotal.toFixed(2)}</span>
      </div>

      ${
        this.customer.state === 'Tamil Nadu'
        ? `
        <div class="row"><span>CGST</span><span>₹${this.cgstTotal.toFixed(2)}</span></div>
        <div class="row"><span>SGST</span><span>₹${this.sgstTotal.toFixed(2)}</span></div>
        `
        : `
        <div class="row"><span>IGST</span><span>₹${this.igstTotal.toFixed(2)}</span></div>
        `
      }

      <div class="row">
        <span>Discount</span>
        <span>- ₹${this.discountTotal.toFixed(2)}</span>
      </div>

      <div class="row grand">
        <span>Grand Total</span>
        <span>₹${this.grandTotal.toFixed(2)}</span>
      </div>

    </div>

    <!-- WORDS -->
    <div class="words">
      <strong>Total in Words:</strong> ${amountWords}
    </div>

  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div>Thank you for your business</div>
    <div class="signature">Authorized Signature</div>
  </div>

</div>

</body>
</html>
`);

  popup.document.close();

  /* ================= SUCCESS MESSAGE ================= */

  setTimeout(() => {
    alert("✅ Bill generated successfully!");
  }, 500);
}

async downloadPDF() {

  try {

    const element = document.getElementById('invoice-print');

    if (!element) {
      alert("Invoice not found");
      return;
    }

    const canvas = await html2canvas(element, {
      scale: 2
    });

    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');

    const imgWidth = 210;
    const imgHeight = canvas.height * imgWidth / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    pdf.save(`Invoice-${this.invoiceNumber}.pdf`);

  } catch (error) {

    console.error("PDF Error:", error);
    alert("PDF failed");

  }

}

numberToWords(num: number): string {

  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten",
  "Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];

  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];

  if (num === 0) return "Zero";

  if (num < 20) return ones[num];

  if (num < 100)
    return tens[Math.floor(num/10)] + " " + ones[num%10];

  if (num < 1000)
    return ones[Math.floor(num/100)] + " Hundred " + this.numberToWords(num%100);

  if (num < 100000)
    return this.numberToWords(Math.floor(num/1000)) + " Thousand " + this.numberToWords(num%1000);

  if (num < 10000000)
    return this.numberToWords(Math.floor(num/100000)) + " Lakh " + this.numberToWords(num%100000);

  return this.numberToWords(Math.floor(num/10000000)) + " Crore " + this.numberToWords(num%10000000);
}

}