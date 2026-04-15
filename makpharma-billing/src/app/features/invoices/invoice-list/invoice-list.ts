import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { SalesService } from '../../../services/sales';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './invoice-list.html',
  styleUrls: ['./invoice-list.css']
})
export class InvoiceList implements OnInit, OnDestroy {

  invoices: any[] = [];
  searchText: string = '';

  currentPage: number = 1;
  itemsPerPage: number = 5;

  private sub = new Subscription();

  constructor(
    private salesService: SalesService,
    private router: Router
  ) {}

  /* ======================================== */
  ngOnInit(): void {

    this.salesService.loadInvoices();

    this.sub.add(
      this.salesService.invoices$.subscribe(data => {

        // ✅ KEEP FULL DATA (IMPORTANT FIX)
        this.invoices = (data || []).map((inv: any) => ({

          ...inv, // 🔥 KEEP EVERYTHING

          // ✅ UI friendly fields
          invoiceNumber: inv.invoiceNumber || 'N/A',

          customer: {
            name: inv.customerName || inv.customer?.name || '',
            phone: inv.customerPhone || inv.customer?.phone || ''
          },

          total: Number(inv.totalAmount || inv.total || 0),
          payment: inv.paymentMethod || inv.payment || 'Cash',

          date: inv.date ? new Date(inv.date) : new Date()

        }));

        console.log("🔥 FULL INVOICE DATA:", this.invoices);

      })
    );
  }

  /* ======================================== */
  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  /* ======================================== */
  get filteredInvoices() {

    const text = this.searchText.toLowerCase();

    return this.invoices.filter(inv =>
      (inv.customer?.name || '').toLowerCase().includes(text) ||
      (inv.invoiceNumber || '').toLowerCase().includes(text)
    );
  }

  /* ======================================== */
  get paginatedInvoices() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredInvoices.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.max(
      Math.ceil(this.filteredInvoices.length / this.itemsPerPage),
      1
    );
  }

  changePage(page: number): void {
    this.currentPage = page;
  }

  onSearchChange(): void {
    this.currentPage = 1;
  }

  /* ======================================== */
  viewInvoice(invoice: any): void {
    this.router.navigate(['/invoice', invoice.invoiceNumber]);
  }

  /* ======================================== */
printInvoice(invoice: any): void {

  const fullInvoice = invoice;

  const logo = window.location.origin + "/assets/makpharma.png";

  // ✅ SAFE ITEMS
  const items = (fullInvoice.items || []).map((item: any) => {

    const rate = item.sellingPrice || item.price || 0;
    const qty = item.qty || 0;
    const gst = item.gst || 0;

    const amount = item.total || (rate * qty);

    return {
      name: item.medicine || item.name || 'Item',
      rate,
      qty,
      gst,
      amount
    };
  });

  // ✅ CALCULATIONS (FIXED)
  let subtotal = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

 items.forEach((item: any) => {
    const base = item.rate * item.qty;
    const gstAmount = (base * item.gst) / 100;

    subtotal += base;

    // 🔥 assuming Tamil Nadu (same as your POS)
    cgst += gstAmount / 2;
    sgst += gstAmount / 2;
  });

  const grandTotal = Math.round(subtotal + cgst + sgst);

  const amountWords = this.numberToWords(grandTotal) + " Only";

  const popup = window.open('', '', 'width=1000,height=900');

  if (!popup) {
    alert("Popup blocked!");
    return;
  }

  popup.document.write(`

<html>
<head>
<title>Invoice</title>

<style>
@page { size: A4; margin: 0; }
body { margin: 0; padding: 10px; font-family: 'Segoe UI', Arial; }

.page {
  width: calc(100% - 20px);
  height: calc(297mm - 20px);
  border: 2px solid #000;
  padding: 8mm;
}

.header {
  display: flex;
  justify-content: space-between;
  border-bottom: 2px solid #000;
  padding-bottom: 10px;
}

.logo { height: 70px; }

.title { font-size: 26px; font-weight: bold; }

.info {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  border-bottom: 1px solid #000;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

th, td {
  border: 1px solid #000;
  padding: 6px;
  text-align: center;
}

td.left { text-align: left; }

</style>
</head>

<body onload="setTimeout(()=>{window.print();window.close();},300)">

<div class="page">

<div class="header">
  <img src="${logo}" class="logo"/>
  <div>
    <strong>MAK PHARMA</strong><br>
    Chennai
  </div>
  <div class="title">TAX INVOICE</div>
</div>

<div class="info">
  <div>
    <strong>Invoice No:</strong> ${fullInvoice.invoiceNumber}<br>
    <strong>Date:</strong> ${new Date(fullInvoice.date).toLocaleDateString()}
  </div>

  <div>
    <strong>Bill To:</strong><br>
    ${fullInvoice.customer?.name}<br>
    ${fullInvoice.customer?.phone}
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

${items.map((item:any,i:number)=>`
<tr>
  <td>${i+1}</td>
  <td class="left">${item.name}</td>
  <td>${item.rate.toFixed(2)}</td>
  <td>${item.qty}</td>
  <td>${item.gst}%</td>
  <td>${item.amount.toFixed(2)}</td>
</tr>
`).join('')}

</table>

<br>

<div style="width:300px;margin-left:auto;border:1px solid #000">
  <div style="display:flex;justify-content:space-between;padding:5px">
    <span>Subtotal</span>
    <span>₹${subtotal.toFixed(2)}</span>
  </div>
  <div style="display:flex;justify-content:space-between;padding:5px">
    <span>CGST</span>
    <span>₹${cgst.toFixed(2)}</span>
  </div>
  <div style="display:flex;justify-content:space-between;padding:5px">
    <span>SGST</span>
    <span>₹${sgst.toFixed(2)}</span>
  </div>
  <div style="display:flex;justify-content:space-between;padding:5px;font-weight:bold">
    <span>Grand Total</span>
    <span>₹${grandTotal.toFixed(2)}</span>
  </div>
</div>

<p><strong>Total in Words:</strong> ${amountWords}</p>

</div>

</body>
</html>

  `);

  popup.document.close();
}

  /* ======================================== */
  numberToWords(num: number): string {
    const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten",
    "Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];

    const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];

    if (num === 0) return "Zero";
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num/10)] + " " + ones[num%10];
    if (num < 1000) return ones[Math.floor(num/100)] + " Hundred " + this.numberToWords(num%100);

    if (num < 100000)
      return this.numberToWords(Math.floor(num/1000)) + " Thousand " + this.numberToWords(num%1000);

    if (num < 10000000)
      return this.numberToWords(Math.floor(num/100000)) + " Lakh " + this.numberToWords(num%100000);

    return this.numberToWords(Math.floor(num/10000000)) + " Crore " + this.numberToWords(num%10000000);
  }

  /* ======================================== */
  editInvoice(invoice: any): void {
    this.router.navigate(['/edit-invoice', invoice._id]);
  }

  deleteInvoice(invoice: any): void {

    if (!confirm(`Delete invoice ${invoice.invoiceNumber}?`)) return;

    this.salesService.deleteInvoice(invoice._id).subscribe({
      next: () => {
        alert("Invoice deleted");
        this.invoices = this.invoices.filter(i => i._id !== invoice._id);
      }
    });
  }

  /* ======================================== */
  getTotalSales(): number {
    return this.invoices.reduce(
      (sum: number, inv: any) => sum + Number(inv.total || 0),
      0
    );
  }

  trackById(index: number, item: any): string {
    return item._id;
  }

}