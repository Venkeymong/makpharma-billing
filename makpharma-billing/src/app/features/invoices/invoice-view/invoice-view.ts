import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SalesService } from '../../../services/sales';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-invoice-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-view.html',
  styleUrl: './invoice-view.css'
})
export class InvoiceView implements OnInit, OnDestroy {

  invoice: any;
  private sub = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private salesService: SalesService,
    private router: Router // 🔥 FIXED
  ) {}

  /* ================= INIT ================= */

  ngOnInit() {

    const invoiceNumber = this.route.snapshot.paramMap.get('id');

    /* 🔥 FIX: LOAD DATA ON REFRESH */
    this.salesService.loadInvoices();

    this.sub.add(
      this.salesService.invoices$.subscribe(data => {

        if (invoiceNumber && data.length) {

          this.invoice = data.find(inv =>
            inv.invoiceNumber === invoiceNumber
          );

          if (!this.invoice) {
            alert("❌ Invoice not found!");
            this.router.navigate(['/invoices']); // 🔥 FIX
          }

        }

      })
    );
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  /* ================= CALCULATIONS ================= */

  getSubtotal(): number {
    if (!this.invoice?.items) return 0;

    return this.invoice.items.reduce((sum: number, item: any) => {
      return sum + (item.qty * item.price);
    }, 0);
  }

 getRoundOff(): number {

  const subtotal = this.getSubtotal();

  const gst =
    Number(this.invoice?.cgst || 0) +
    Number(this.invoice?.sgst || 0) +
    Number(this.invoice?.igst || 0);

  const exactTotal = subtotal + gst;

  /* 🔥 APPLY ROUNDING */
  const roundedTotal = Math.round(exactTotal);

  return Number((roundedTotal - exactTotal).toFixed(2));
}

  /* ================= BACK BUTTON FIX ================= */

  goBack(): void {
    this.router.navigate(['/invoices']); // 🔥 FIXED
  }

  /* ================= PRINT ================= */

  print() {

  if (!this.invoice) {
    alert("Invoice not loaded");
    return;
  }

  const confirmPrint = confirm("Do you want to print this invoice?");
  if (!confirmPrint) return;

  const logo = window.location.origin + "/assets/makpharma.png";

  // ✅ REBUILD CART (LIKE POS)
  const cart = (this.invoice.items || []).map((item: any) => ({
    name: item.medicine || item.name || 'Item',
    qty: item.qty || 0,
    price: item.price || 0,
    sellingPrice: item.sellingPrice || item.price || 0,
    gst: item.gst || 0
  }));

  // ✅ CALCULATIONS (EXACT POS LOGIC)
  let subtotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;
  let discountTotal = 0;

  cart.forEach((item: any) => {
    const rate = item.sellingPrice || item.price;
    const base = rate * item.qty;
    const gstAmount = (base * item.gst) / 100;

    subtotal += base;

    if ((this.invoice.customerState || 'Tamil Nadu') === 'Tamil Nadu') {
      cgstTotal += gstAmount / 2;
      sgstTotal += gstAmount / 2;
    } else {
      igstTotal += gstAmount;
    }
  });

  const grandTotal = Math.round(subtotal + cgstTotal + sgstTotal + igstTotal - discountTotal);

  const amountWords = this.numberToWords(grandTotal) + " Only";

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
@page { size: A4; margin: 0; }
body { margin: 0; padding: 10px; background: #fff; font-family: 'Segoe UI', Arial; }

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

.watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 520px;
  opacity: 0.06;
  z-index: 0;
}

.page > *:not(.watermark) { position: relative; z-index: 2; }

.content { flex: 1; }

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #000;
  padding-bottom: 10px;
}

.logo { height: 70px; }

.company { font-size: 14px; line-height: 1.4; }

.title { font-size: 26px; font-weight: bold; }

.info {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  border-bottom: 1px solid #000;
  padding-bottom: 8px;
  font-size: 13px;
}

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

td.left { text-align: left; }

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

.row:last-child { border-bottom: none; }

.grand { font-weight: bold; background: #f1f5f9; }

.words {
  margin-top: 12px;
  border-top: 1px dashed #000;
  padding-top: 6px;
  font-size: 13px;
}

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

<div class="header">
  <img src="${logo}" class="logo"/>
  <div class="company">
    <strong>MAK PHARMA</strong><br>
    Chennai - 600037<br>
    Phone: 9092700152
  </div>
  <div class="title">TAX INVOICE</div>
</div>

<div class="info">
  <div>
    <strong>Invoice No:</strong> ${this.invoice.invoiceNumber}<br>
    <strong>Date:</strong> ${new Date(this.invoice.date).toLocaleDateString()}
  </div>

  <div>
    <strong>Bill To:</strong><br>
    ${this.invoice.customerName || this.invoice.customer?.name}<br>
    ${this.invoice.customerPhone || this.invoice.customer?.phone}
  </div>
</div>

<table>
<tr>
  <th>#</th>
  <th>Description</th>
  <th>Rate</th>
  <th>Qty</th>
  <th>GST%</th>
  <th>Amount</th>
</tr>

${cart.map((item:any,i:number)=>`
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

<div class="totals">

<div class="row">
  <span>Subtotal</span>
  <span>₹${subtotal.toFixed(2)}</span>
</div>

${
  (this.invoice.customerState || 'Tamil Nadu') === 'Tamil Nadu'
  ? `
  <div class="row"><span>CGST</span><span>₹${cgstTotal.toFixed(2)}</span></div>
  <div class="row"><span>SGST</span><span>₹${sgstTotal.toFixed(2)}</span></div>
  `
  : `
  <div class="row"><span>IGST</span><span>₹${igstTotal.toFixed(2)}</span></div>
  `
}

<div class="row">
  <span>Discount</span>
  <span>- ₹${discountTotal.toFixed(2)}</span>
</div>

<div class="row grand">
  <span>Grand Total</span>
  <span>₹${grandTotal.toFixed(2)}</span>
</div>

</div>

<div class="words">
<strong>Total in Words:</strong> ${amountWords}
</div>

</div>

<div class="footer">
  <div>Thank you for your business</div>
  <div class="signature">Authorized Signature</div>
</div>

</div>

</body>
</html>
  `);

  popup.document.close();
}
  /* ================= WORDS ================= */

  numberToWords(num: number): string {

    const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten",
    "Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];

    const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];

    if (num === 0) return "Zero";
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num/10)] + " " + ones[num%10];
    if (num < 1000) return ones[Math.floor(num/100)] + " Hundred " + this.numberToWords(num%100);
    if (num < 100000) return this.numberToWords(Math.floor(num/1000)) + " Thousand " + this.numberToWords(num%1000);
    if (num < 10000000) return this.numberToWords(Math.floor(num/100000)) + " Lakh " + this.numberToWords(num%100000);

    return this.numberToWords(Math.floor(num/10000000)) + " Crore " + this.numberToWords(num%10000000);
  }

}