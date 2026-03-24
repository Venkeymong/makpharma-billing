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

  /* ========================================
     DATA
  ======================================== */

  invoices: any[] = [];
  searchText: string = '';

  /* ========================================
     PAGINATION
  ======================================== */

  currentPage: number = 1;
  itemsPerPage: number = 5;

  /* ========================================
     SUBSCRIPTION
  ======================================== */

  private sub = new Subscription();

  constructor(
    private salesService: SalesService,
    private router: Router
  ) {}

  /* ========================================
     INIT
  ======================================== */

  ngOnInit(): void {

    this.sub.add(
      this.salesService.invoices$.subscribe(data => {

        this.invoices = (data || []).map(inv => ({

          /* ================= CORE ================= */

          ...inv,

          _id: inv._id, // ✅ ensure ID exists

          invoiceNumber: inv.invoiceNumber || 'N/A',

          /* ================= CUSTOMER ================= */

          customer: {
            name: inv.customer?.name || 'Walk-in',
            phone: inv.customer?.phone || '-'
          },

          /* ================= OTHER ================= */

          total: inv.total || 0,
          payment: inv.payment || 'Cash',
          date: inv.date || new Date()

        }));

      })
    );
  }

  /* ========================================
     DESTROY
  ======================================== */

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

  /* ========================================
     SEARCH RESET
  ======================================== */

  onSearchChange(): void {
    this.currentPage = 1;
  }

  /* ========================================
     ACTIONS
  ======================================== */

  viewInvoice(invoice: any): void {
    this.router.navigate(['/invoice', invoice.invoiceNumber]);
  }

  deleteInvoice(invoice: any): void {

    if (!invoice?._id) {
      alert("Invalid invoice ID");
      return;
    }

    if (confirm(`Delete invoice ${invoice.invoiceNumber}?`)) {
      this.salesService.deleteInvoice(invoice._id);
    }
  }

  editInvoice(invoice: any): void {
    alert(`Edit feature coming soon for ${invoice.invoiceNumber}`);
  }

  /* ========================================
     PRINT
  ======================================== */

  printInvoice(invoice: any): void {

    this.router.navigate(['/invoice', invoice.invoiceNumber]).then(() => {

      setTimeout(() => {
        window.print();
      }, 500);

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