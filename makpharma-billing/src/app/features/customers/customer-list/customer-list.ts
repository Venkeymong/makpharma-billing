import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../../services/customer';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.css'
})
export class CustomerList implements OnInit, OnDestroy {

  customers: any[] = [];

  searchText: string = '';

  showForm: boolean = false;

  editCustomerId: string | null = null;

  customer: any = this.getEmptyCustomer();

  // ✅ Pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;

  private sub = new Subscription();

  constructor(private customerService: CustomerService) {}

  /* =========================================
     INIT
  ========================================= */

  ngOnInit(): void {
    this.sub.add(
      this.customerService.customers$.subscribe(data => {
        this.customers = data || [];
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  /* =========================================
     FORM
  ========================================= */

  getEmptyCustomer() {
    return {
      name: '',
      phone: '',
      email: '',
      address: '',
      state: 'Tamil Nadu',
      gst: ''
    };
  }

  openForm() {
    this.showForm = true;
    this.editCustomerId = null;
    this.customer = this.getEmptyCustomer();
  }

  saveCustomer() {

    if (!this.customer.name?.trim()) {
      alert('Customer name required');
      return;
    }

    if (this.editCustomerId === null) {

      this.customerService.addCustomer({ ...this.customer }).subscribe({
        next: () => this.resetForm(),
        error: () => alert('Failed to add customer')
      });

    } else {

      this.customerService.updateCustomer(this.editCustomerId, { ...this.customer }).subscribe({
        next: () => this.resetForm(),
        error: () => alert('Failed to update customer')
      });

    }
  }

  editCustomer(customer: any) {
    this.editCustomerId = customer._id;
    this.customer = { ...customer };
    this.showForm = true;
  }

  deleteCustomer(customer: any) {

    if (!customer?._id) return;

    if (confirm(`Delete ${customer.name}?`)) {

      this.customerService.deleteCustomer(customer._id).subscribe({
        error: () => alert('Delete failed')
      });

    }
  }

  resetForm() {
    this.customer = this.getEmptyCustomer();
    this.showForm = false;
    this.editCustomerId = null;
  }

  /* =========================================
     FILTER
  ========================================= */

  get filteredCustomers() {
    const text = this.searchText.toLowerCase();

    return this.customers.filter(x =>
      x.name?.toLowerCase().includes(text) ||
      x.phone?.includes(text) ||
      x.email?.toLowerCase().includes(text)
    );
  }

  /* =========================================
     PAGINATION
  ========================================= */

  get paginatedCustomers() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredCustomers.slice(start, start + this.itemsPerPage);
  }

  get totalPages() {
    return Math.max(Math.ceil(this.filteredCustomers.length / this.itemsPerPage), 1);
  }

  changePage(page: number) {
    this.currentPage = page;
  }

  /* =========================================
     DOWNLOAD
  ========================================= */

  downloadCustomer(customer: any) {

    const data = JSON.stringify(customer, null, 2);
    const blob = new Blob([data], { type: 'application/json' });

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${customer.name}.json`;
    a.click();

    window.URL.revokeObjectURL(url);
  }

  downloadAllCustomers() {

    const data = JSON.stringify(this.customers, null, 2);
    const blob = new Blob([data], { type: 'application/json' });

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `all_customers.json`;
    a.click();

    window.URL.revokeObjectURL(url);
  }

}