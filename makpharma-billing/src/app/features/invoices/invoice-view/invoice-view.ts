import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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
    private salesService: SalesService
  ) {}

  /* ================= INIT ================= */

  ngOnInit() {

    const invoiceNumber = this.route.snapshot.paramMap.get('id');

    this.sub.add(
      this.salesService.invoices$.subscribe(data => {

        if (invoiceNumber && data.length) {

          this.invoice = data.find(inv =>
            inv.invoiceNumber === invoiceNumber
          );

          if (!this.invoice) {
            alert("❌ Invoice not found!");
          }

        }

      })
    );
  }

  /* ================= DESTROY ================= */

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  /* ================= PRINT ================= */

  print() {

    if (!this.invoice) {
      alert("Invoice not loaded");
      return;
    }

    const confirmPrint = confirm("Do you want to print this invoice?");
    if (!confirmPrint) return;

    const amountWords = this.numberToWords(this.invoice.total) + " Only";
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
        @page { size: A4; margin: 5mm; }

        body {
          font-family: Arial;
          margin: 0;
        }

        .invoice {
          border: 1px solid #000;
          padding: 10px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #000;
          padding-bottom: 8px;
        }

        .logo { height: 60px; }

        .title { font-size: 22px; font-weight: bold; }

        .info {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          border-bottom: 1px solid #000;
          padding-bottom: 6px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
        }

        th, td {
          border: 1px solid #000;
          padding: 5px;
          font-size: 12px;
          text-align: center;
        }

        td.left { text-align: left; }

        .totals {
          width: 35%;
          margin-left: auto;
          margin-top: 10px;
        }

        .row {
          display: flex;
          justify-content: space-between;
        }

        .grand {
          border-top: 2px solid #000;
          font-weight: bold;
        }

        .words {
          margin-top: 10px;
          border-top: 1px solid #000;
          padding-top: 6px;
        }

        .footer {
          margin-top: 30px;
          display: flex;
          justify-content: space-between;
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
            ${this.invoice.customer.name}<br>
            ${this.invoice.customer.phone}
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
            <span>Total</span>
            <span>₹${this.invoice.total.toFixed(2)}</span>
          </div>

          <div class="row grand">
            <span>Grand Total</span>
            <span>₹${this.invoice.total.toFixed(2)}</span>
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

  /* ================= NUMBER TO WORDS ================= */

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