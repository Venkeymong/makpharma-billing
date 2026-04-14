import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SalesService } from '../../services/sales';

@Component({
  selector: 'app-edit-invoice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-invoice.html'
})
export class EditInvoiceComponent implements OnInit {

  invoice: any;

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

    this.invoice = data.find(i => i._id === id);

    if (!this.invoice) {
      alert("Invoice not found");
      this.router.navigate(['/invoices']); // ✅ FIXED ROUTE
    }
  }

  /* ========================================
     SAVE INVOICE (FIXED)
  ======================================== */

  saveInvoice(): void {

    if (!this.invoice || !this.invoice._id) {
      alert("Invalid invoice data");
      return;
    }

    console.log("🛠️ Editing Invoice:", this.invoice);

    /* 🔥 FORMAT DATA BEFORE SAVE */
    const updatedInvoice = {

      ...this.invoice,

      customer: {
        name: this.invoice.customer?.name || 'Walk-in',
        phone: this.invoice.customer?.phone || '-',
        state: this.invoice.customer?.state || 'Tamil Nadu',
        gst: this.invoice.customer?.gst || ''
      },

      items: (this.invoice.items || []).map((item: any) => ({
        medicine: item.name || item.medicine,
        batch: item.batch || '',
        qty: Number(item.qty || 0),
        price: Number(item.price || 0),
        sellingPrice: Number(item.price || 0),
        gst: Number(item.gst || 0),
        total: Number(item.qty || 0) * Number(item.price || 0)
      })),

      subtotal: Number(this.invoice.subtotal || 0),
      totalAmount: Number(this.invoice.total || 0),

      paymentMethod: this.invoice.payment || "Cash"
    };

    console.log("📦 Updated Data:", updatedInvoice);

    /* 🔥 DELETE OLD INVOICE */
    this.salesService.deleteInvoice(this.invoice._id).subscribe({

      next: () => {

        console.log("🗑️ Old invoice deleted");

        /* 🔥 ADD UPDATED INVOICE */
        this.salesService.addInvoice(updatedInvoice).subscribe({

          next: () => {
            alert("✅ Invoice updated successfully");
            this.router.navigate(['/invoices']); // ✅ FIXED ROUTE
          },

          error: (err) => {
            console.error("❌ Add Error:", err);
            alert("Failed to save updated invoice");
          }

        });

      },

      error: (err) => {
        console.error("❌ Delete Error:", err);
        alert("Failed to update invoice");
      }

    });

  }

}