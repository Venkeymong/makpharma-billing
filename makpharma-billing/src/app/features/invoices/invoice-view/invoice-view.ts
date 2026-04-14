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

    const subtotal = this.getSubtotal();
    const roundOff = this.getRoundOff();
    const finalTotal = Number(this.invoice.total || 0);

    const amountWords = this.numberToWords(Math.round(finalTotal)) + " Only";

    const logo = window.location.origin + "/assets/makpharma.png";

    const popup = window.open('', '', 'width=1000,height=900');

    if (!popup) {
      alert("Popup blocked");
      return;
    }

    popup.document.write(`
    <html>
    <head>
      <title>Invoice</title>

      <style>
        @page { size: A4; margin: 8mm; }

        body {
          font-family: Arial;
          margin: 0;
        }

        .invoice {
          border: 2px solid #000;
          padding: 12px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
        }

        .logo { height: 65px; }

        .title {
          font-size: 22px;
          font-weight: bold;
        }

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

        th, td {
          border: 1px solid #000;
          padding: 6px;
          font-size: 12px;
          text-align: center;
        }

        td.left { text-align: left; }

        .totals {
          width: 40%;
          margin-left: auto;
          margin-top: 12px;
          font-size: 13px;
        }

        .row {
          display: flex;
          justify-content: space-between;
          padding: 3px 0;
        }

        .grand {
          border-top: 2px solid #000;
          font-weight: bold;
          font-size: 14px;
        }

        .words {
          margin-top: 10px;
          border-top: 1px solid #000;
          padding-top: 6px;
          font-size: 13px;
        }

        .footer {
          margin-top: 35px;
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }
      </style>

    </head>

    <body onload="setTimeout(()=>{window.print();window.close();},300)">

      <div class="invoice">

        <div class="header">
          <img src="${logo}" class="logo"/>

          <div>
            <strong>MAK PHARMA</strong><br>
            Chennai - 600037<br>
            Phone: 9092700152
          </div>

          <div class="title">TAX INVOICE</div>
        </div>

        <div class="info">
          <div>
            Invoice: ${this.invoice.invoiceNumber}<br>
            Date: ${new Date(this.invoice.date).toLocaleDateString()}
          </div>

          <div>
            <strong>Bill To:</strong><br>
            ${this.invoice.customer?.name || ''}<br>
            ${this.invoice.customer?.phone || ''}
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

          ${this.invoice.items.map((item:any,i:number)=>`
          <tr>
            <td>${i+1}</td>
            <td class="left">${item.name}</td>
            <td>${item.price.toFixed(2)}</td>
            <td>${item.qty}</td>
            <td>${item.gst}%</td>
            <td>${(item.qty * item.price).toFixed(2)}</td>
          </tr>
          `).join('')}
        </table>

        <div class="totals">

          <div class="row">
            <span>Subtotal</span>
            <span>₹${subtotal.toFixed(2)}</span>
          </div>

          <div class="row">
            <span>Round Off</span>
            <span>₹${roundOff.toFixed(2)}</span>
          </div>

          <div class="row grand">
            <span>Grand Total</span>
            <span>₹${finalTotal.toFixed(2)}</span>
          </div>

        </div>

        <div class="words">
          <strong>Total In Words:</strong><br>
          ${amountWords}
        </div>

        <div class="footer">
          <div>Thank you for your business</div>
          <div>Authorized Signature</div>
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