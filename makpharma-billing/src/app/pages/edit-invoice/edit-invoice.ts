import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SalesService } from '../../services/sales';

@Component({
  selector: 'app-edit-invoice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-invoice.html',
  styleUrls: ['./edit-invoice.css']
})
export class EditInvoiceComponent implements OnInit {

  invoice: any = null;

  constructor(
    private route: ActivatedRoute,
    private salesService: SalesService,
    private router: Router
  ) {}

  /* ========================================
     INIT
  ======================================== */

  ngOnInit(): void {

    const id = this.route.snapshot.paramMap.get('id');

    const data = this.salesService.getInvoices();

    if (!data || data.length === 0) {

      this.salesService.loadInvoices();

      setTimeout(() => {

        const fresh = this.salesService.getInvoices();
        this.invoice = fresh.find(i => i._id === id);

        if (!this.invoice) {
          alert("Invoice not found");
          this.router.navigate(['/invoices']);
        }

      }, 500);

    } else {

      this.invoice = data.find(i => i._id === id);

      if (!this.invoice) {
        alert("Invoice not found");
        this.router.navigate(['/invoices']);
      }
    }
  }

  /* ========================================
     SAVE INVOICE (FINAL FIX)
  ======================================== */

  saveInvoice(): void {

    if (!this.invoice || !this.invoice._id) {
      alert("Invalid invoice data");
      return;
    }

    console.log("🛠️ Editing Invoice:", this.invoice);

    const originalInvoice = { ...this.invoice };

    /* 🔥 SAFE ITEMS */
    const safeItems = (this.invoice.items || []).map((item: any) => {

      const qty = Number(item.qty || 1);
      const price = Number(item.price || item.sellingPrice || 1);

      return {
        medicine: item.name || item.medicine || '',
        batch: item.batch || '',
        qty: qty,

        price: price,
        sellingPrice: price,

        gst: Number(item.gst || 0),
        total: qty * price
      };
    });

    /* 🔥 AUTO CALCULATE TOTAL */
   const totalAmount = safeItems.reduce(
  (sum: number, i: any) => sum + Number(i.total || 0),
  0
);

    const updatedInvoice = {

      invoiceNumber: this.invoice.invoiceNumber,

      customerName: this.invoice.customer?.name || 'Walk-in',
      customerPhone: this.invoice.customer?.phone || '-',
      customerState: this.invoice.customer?.state || 'Tamil Nadu',
      customerGST: this.invoice.customer?.gst || '',

      date: this.invoice.date || new Date(),

      items: safeItems,

      subtotal: totalAmount,
      cgst: Number(this.invoice.cgst || 0),
      sgst: Number(this.invoice.sgst || 0),
      igst: Number(this.invoice.igst || 0),

      totalAmount: totalAmount,

      paymentMethod: this.invoice.payment || 'Cash'
    };

    console.log("📦 FINAL PAYLOAD:", updatedInvoice);

    /* 🔥 STEP 1: ADD NEW */
    this.salesService.addInvoice(updatedInvoice).subscribe({

      next: () => {

        console.log("✅ New invoice added");

        /* 🔥 STEP 2: DELETE OLD */
        this.salesService.deleteInvoice(originalInvoice._id).subscribe({

          next: () => {
            alert("✅ Invoice updated successfully");
            this.router.navigate(['/invoices']);
          },

          error: () => {
            alert("⚠️ New saved, but old delete failed");
          }

        });

      },

      error: (err) => {
        console.error("❌ Add failed:", err);
        alert("Update failed — old invoice NOT deleted");
      }

    });
  }

}