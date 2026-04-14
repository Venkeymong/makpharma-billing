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
  styleUrl: './invoice-list.css'
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

  ngOnInit(): void {

    this.sub.add(
      this.salesService.invoices$.subscribe(data => {

        this.invoices = (data || []).map((inv: any) => ({
          ...inv,

          _id: inv._id,

          invoiceNumber: inv.invoiceNumber || 'N/A',

          customer: {
            name: inv.customerName || 'Walk-in',
            phone: inv.customerPhone || '-'
          },

          total: inv.totalAmount || 0,
          payment: inv.paymentMethod || 'Cash',

          date: inv.createdAt || new Date()
        }));

      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  /* ========================================
     FILTER
  ======================================== */

  get filteredInvoices() {
    const text = this.searchText.toLowerCase();

    return this.invoices.filter(inv =>
      inv.customer.name.toLowerCase().includes(text) ||
      inv.invoiceNumber.toLowerCase().includes(text)
    );
  }

  /* ========================================
     PAGINATION
  ======================================== */

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

  /* ========================================
     ACTIONS
  ======================================== */

  viewInvoice(invoice: any): void {
    this.router.navigate(['/invoice', invoice.invoiceNumber]);
  }

  printInvoice(invoice: any): void {
    this.router.navigate(['/invoice', invoice.invoiceNumber]).then(() => {
      setTimeout(() => window.print(), 500);
    });
  }

editInvoice(invoice: any): void {
  this.router.navigate(['/edit-invoice', invoice._id]);
}

  deleteInvoice(invoice: any): void {

    if (!invoice?._id) {
      alert("Invalid invoice ID");
      return;
    }

    if (!confirm(`Delete invoice ${invoice.invoiceNumber}?`)) return;

    this.salesService.deleteInvoice(invoice._id).subscribe({

      next: () => {

        alert("Invoice deleted successfully");

        /* 🔥 REMOVE FROM UI */
        this.invoices = this.invoices.filter(i => i._id !== invoice._id);

      },

      error: (err) => {
        console.error("Delete Error:", err);
        alert("Failed to delete invoice");
      }

    });
  }

  /* ========================================
     KPI
  ======================================== */

  getTotalSales(): number {
    return this.invoices.reduce(
      (sum, inv) => sum + (inv.total || 0),
      0
    );
  }

}