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

  /* ================= INIT ================= */

  ngOnInit(): void {
    this.salesService.loadInvoices();

    this.sub.add(
      this.salesService.invoices$.subscribe(data => {
        this.invoices = (data || []).map((inv: any) => ({
          ...inv,

          invoiceNumber: inv.invoiceNumber || 'N/A',

          customer: {
            name: inv.customerName || inv.customer?.name || '',
            phone: inv.customerPhone || inv.customer?.phone || ''
          },

          total: Number(inv.totalAmount || inv.total || 0),
          payment: inv.paymentMethod || inv.payment || 'Cash',

          date: inv.date ? new Date(inv.date) : new Date()
        }));

        console.log('🔥 FULL INVOICE DATA:', this.invoices);
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  /* ================= FILTER ================= */

  get filteredInvoices() {
    const text = this.searchText.toLowerCase();

    return this.invoices.filter(inv =>
      (inv.customer?.name || '').toLowerCase().includes(text) ||
      (inv.invoiceNumber || '').toLowerCase().includes(text)
    );
  }

  /* ================= PAGINATION ================= */

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
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  onSearchChange(): void {
    this.currentPage = 1;
  }

  /* ================= ACTIONS ================= */

  viewInvoice(invoice: any): void {
    this.router.navigate(['/invoice', invoice.invoiceNumber], {
      state: { invoice }
    });
  }

  editInvoice(invoice: any): void {
    this.router.navigate(['/edit-invoice', invoice._id]);
  }

  deleteInvoice(invoice: any): void {
    if (!confirm(`Delete invoice ${invoice.invoiceNumber}?`)) return;

    this.salesService.deleteInvoice(invoice._id).subscribe({
      next: () => {
        alert('Invoice deleted');
        this.invoices = this.invoices.filter(i => i._id !== invoice._id);
      }
    });
  }

  /* ================= TOTAL SALES ================= */

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