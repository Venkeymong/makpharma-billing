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
    private router: Router
  ) {}

ngOnInit() {

  const stateInvoice = history.state?.invoice;

  if (stateInvoice) {
    this.invoice = stateInvoice;
    return; // 🔥 STOP HERE (VERY IMPORTANT)
  }

  const invoiceNumber = this.route.snapshot.paramMap.get('id');

  this.salesService.loadInvoices();

  this.sub.add(
    this.salesService.invoices$.subscribe(data => {

      if (invoiceNumber && data.length) {

        this.invoice = data.find(inv =>
          inv.invoiceNumber === invoiceNumber
        );

        if (!this.invoice) {
          alert("❌ Invoice not found!");
          this.router.navigate(['/invoices']);
        }

      }

    })
  );
}

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  /* ================= CALCULATIONS - SAME AS BILLING POS ================= */

  getSubtotal(): number {
    if (!this.invoice?.items) return 0;

    return this.invoice.items.reduce((sum: number, item: any) => {
      const rate = item.sellingPrice || item.price || 0;
      return sum + ((item.qty || 0) * rate);
    }, 0);
  }

  getCGST(): number {
    if (!this.invoice?.items) return 0;

    let total = 0;

    this.invoice.items.forEach((item: any) => {
      const rate = item.sellingPrice || item.price || 0;
      const base = (item.qty || 0) * rate;
      const gstAmount = (base * (item.gst || 0)) / 100;
      total += gstAmount / 2;
    });

    return total;
  }

  getSGST(): number {
    if (!this.invoice?.items) return 0;

    let total = 0;

    this.invoice.items.forEach((item: any) => {
      const rate = item.sellingPrice || item.price || 0;
      const base = (item.qty || 0) * rate;
      const gstAmount = (base * (item.gst || 0)) / 100;
      total += gstAmount / 2;
    });

    return total;
  }

  getIGST(): number {
    if (!this.invoice?.items) return 0;

    let total = 0;

    this.invoice.items.forEach((item: any) => {
      const rate = item.sellingPrice || item.price || 0;
      const base = (item.qty || 0) * rate;
      const gstAmount = (base * (item.gst || 0)) / 100;
      total += gstAmount;
    });

    return total;
  }

  getDiscount(): number {
    return Number(this.invoice?.discountTotal || this.invoice?.discount || 0);
  }

  getGrandTotal(): number {

  if (this.invoice?.totalAmount) {
    return Number(this.invoice.totalAmount);
  }

  if (this.invoice?.total) {
    return Number(this.invoice.total);
  }

  const subtotal = this.getSubtotal();

  const state = this.invoice?.customerState || this.invoice?.customer?.state || 'Tamil Nadu';

  const gst = state === 'Tamil Nadu'
    ? this.getCGST() + this.getSGST()
    : this.getIGST();

  const exactTotal = subtotal + gst - this.getDiscount();

  return Math.round(exactTotal);
}

  getRoundOff(): number {
    const subtotal = this.getSubtotal();

    const state = this.invoice?.customerState || this.invoice?.customer?.state || 'Tamil Nadu';

    const gst = state === 'Tamil Nadu'
      ? this.getCGST() + this.getSGST()
      : this.getIGST();

    const exactTotal = subtotal + gst - this.getDiscount();
    const roundedTotal = Math.round(exactTotal);

    return Number((roundedTotal - exactTotal).toFixed(2));
  }

  goBack(): void {
    this.router.navigate(['/invoices']);
  }

  print() {
    if (!this.invoice) {
      alert("Invoice not loaded");
      return;
    }

    const confirmPrint = confirm("Do you want to print this invoice?");
    if (!confirmPrint) return;

    const logo = window.location.origin + "/assets/makpharma.png";

    const cart = (this.invoice.items || []).map((item: any) => ({
      name: item.medicine || item.name || 'Item',
      qty: item.qty || 0,
      price: item.price || 0,
      sellingPrice: item.sellingPrice || item.price || 0,
      gst: item.gst || 0
    }));

    let subtotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;
    const discountTotal = this.getDiscount();

    cart.forEach((item: any) => {
      const rate = item.sellingPrice || item.price;
      const base = rate * item.qty;
      const gstAmount = (base * item.gst) / 100;

      subtotal += base;

      if ((this.invoice.customerState || this.invoice.customer?.state || 'Tamil Nadu') === 'Tamil Nadu') {
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
  align-items: flex-start;
  border-bottom: 2px solid #000;
  padding-bottom: 10px;
  gap: 12px;
}

.logo { height: 70px; }

.company {
  font-size: 13px;
  line-height: 1.5;
  flex: 1;
}

.title {
  font-size: 26px;
  font-weight: bold;
  white-space: nowrap;
}

.info {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-top: 10px;
  border-bottom: 1px solid #000;
  padding-bottom: 8px;
  font-size: 13px;
}

.info-box {
  width: 48%;
  line-height: 1.5;
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

<body onload="setTimeout(()=>window.print(),700)">

<div class="page">

<img src="${logo}" class="watermark" />

<div class="content">

<div class="header">
  <img src="${logo}" class="logo" onload="window.imageLoaded=true"/>
  <div class="company">
    <strong>MAK PHARMA</strong><br>
    GSTIN: 33BRVPA8905M1ZA<br>
    1st Floor, 560, LIG Type, 8th Street, Mogappair Eri Scheme,<br>
    Mugappair West, Chennai, Tamil Nadu - 600037<br>
    Phone: 9092700152
  </div>
  <div class="title">TAX INVOICE</div>
</div>

<div class="info">
  <div class="info-box">
    <strong>Invoice No:</strong> ${this.invoice.invoiceNumber}<br>
    <strong>Date:</strong> ${new Date(this.invoice.date).toLocaleDateString()}<br>
    <strong>Payment:</strong> ${this.invoice.paymentMethod || this.invoice.payment || 'Cash'}
  </div>

  <div class="info-box">
    <strong>Bill To:</strong><br>
    ${this.invoice.customerName || this.invoice.customer?.name || ''}<br>
    ${this.invoice.customerPhone || this.invoice.customer?.phone || ''}<br>
    ${(this.invoice.customerAddress || this.invoice.customer?.address) ? (this.invoice.customerAddress || this.invoice.customer?.address) + '<br>' : ''}
    ${this.invoice.customerState || this.invoice.customer?.state || 'Tamil Nadu'}
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
  <span>₹{{ (invoice.subtotal || getSubtotal()) | number:'1.2-2' }}</span>
</div>

${
  (this.invoice.customerState || this.invoice.customer?.state || 'Tamil Nadu') === 'Tamil Nadu'
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

<div class="row">
  <span>Round Off</span>
  <span>₹${(grandTotal - (subtotal + cgstTotal + sgstTotal + igstTotal - discountTotal)).toFixed(2)}</span>
</div>

<div class="row grand">
  <span>Grand Total</span>
  <span>₹{{ (invoice.totalAmount || invoice.total || getGrandTotal()) | number:'1.2-2' }}</span>
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