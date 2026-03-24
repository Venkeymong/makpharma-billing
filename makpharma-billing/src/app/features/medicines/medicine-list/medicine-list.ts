// ✅ CLEAN + ERROR FREE VERSION (NO LOGIC CHANGE)

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MedicineService } from '../../../services/medicine';

/* ================= MODELS ================= */

export interface Medicine {
  name: string;
  generic: string;
  manufacturer: string;
  hsn: string;
  batch: string;
  expiry: string;
  mrp: number;
  sellingPrice: number;
  gst: number;
  stock: number;
}

export interface PurchaseItem {
  medicine: string;
  hsn: string;
  batch: string;
  qty: number;
  price: number;
  gst: number;
  total: number;
}

export interface PurchaseOrder {
  supplier: string;
  invoice: string;
  date: string;
  items: PurchaseItem[];
  totalAmount: number;
  billFile?: string;
}

/* ================= COMPONENT ================= */

@Component({
  selector: 'app-medicine-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './medicine-list.html',
  styleUrl: './medicine-list.css'
})

export class MedicineList implements OnInit {

  searchText = '';

  showForm = false;
  showPurchaseForm = false;
  showBillView = false;

  editIndex: number | null = null;
  editPurchaseIndex: number | null = null;

  /* ===== MEDICINE PAGINATION ===== */

  currentPage = 1;
  itemsPerPage = 15;
  totalPages = 1;
  pages: number[] = [];

  /* ===== PURCHASE PAGINATION ===== */

  purchaseCurrentPage = 1;
  purchaseItemsPerPage = 15;
  purchaseTotalPages = 1;
  purchasePages: number[] = [];
  paginatedPurchaseOrders: PurchaseOrder[] = [];

  medicines: Medicine[] = [];
  filteredMedicines: Medicine[] = [];
  paginatedMedicines: Medicine[] = [];

  purchaseOrders: PurchaseOrder[] = [];

  medicine: Medicine = this.createEmptyMedicine();

  purchase = {
    supplier: '',
    invoice: '',
    date: ''
  };

  purchaseItems: PurchaseItem[] = [];
  item: PurchaseItem = this.createEmptyItem();

  uploadedBill: string | null = null;

  constructor(private medicineService: MedicineService) {}

  /* ================= INIT ================= */

ngOnInit(): void {

  this.medicineService.medicines$.subscribe({
    next: (data) => {
      this.medicines = data;
      this.applyFilter();
    },
    error: (err: any) => console.error(err)
  });

  this.loadPurchaseOrders();
}

  /* ================= LOAD ================= */

  loadMedicines(): void {
    this.medicines = this.medicineService.getMedicines() || [];
    this.applyFilter();
  }

  loadPurchaseOrders(): void {
    this.purchaseOrders =
      JSON.parse(localStorage.getItem('purchaseOrders') || '[]');

    this.updatePurchasePagination();
  }

  savePurchaseOrders(): void {
    localStorage.setItem('purchaseOrders', JSON.stringify(this.purchaseOrders));
  }

  /* ================= PAGINATION ================= */

  updatePagination(): void {

    this.totalPages = Math.ceil(this.filteredMedicines.length / this.itemsPerPage);

    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);

    this.setPage(this.currentPage);
  }

  setPage(page: number): void {

    if (page < 1 || page > this.totalPages) return;

    this.currentPage = page;

    const start = (page - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;

    this.paginatedMedicines = this.filteredMedicines.slice(start, end);
  }

  changePage(page: number): void {
    this.setPage(page);
  }

  /* ===== PURCHASE PAGINATION ===== */

  updatePurchasePagination(): void {

    this.purchaseTotalPages = Math.ceil(
      this.purchaseOrders.length / this.purchaseItemsPerPage
    );

    this.purchasePages = Array.from(
      { length: this.purchaseTotalPages },
      (_, i) => i + 1
    );

    this.setPurchasePage(this.purchaseCurrentPage);
  }

  setPurchasePage(page: number): void {

    if (page < 1 || page > this.purchaseTotalPages) return;

    this.purchaseCurrentPage = page;

    const start = (page - 1) * this.purchaseItemsPerPage;
    const end = start + this.purchaseItemsPerPage;

    this.paginatedPurchaseOrders =
      this.purchaseOrders.slice(start, end);
  }

  changePurchasePage(page: number): void {
    this.setPurchasePage(page);
  }

  /* ================= FACTORY ================= */

  createEmptyMedicine(): Medicine {
    return {
      name: '',
      generic: '',
      manufacturer: '',
      hsn: '',
      batch: '',
      expiry: '',
      mrp: 0,
      sellingPrice: 0,
      gst: 0,
      stock: 0
    };
  }

  createEmptyItem(): PurchaseItem {
    return {
      medicine: '',
      hsn: '',
      batch: '',
      qty: 0,
      price: 0,
      gst: 0,
      total: 0
    };
  }

  /* ================= MEDICINE ================= */

  openForm(): void {
    this.resetForm();
    this.showForm = true;
  }
saveMedicine(): void {

  if (!this.medicine.name.trim()) {
    alert("Medicine name is required");
    return;
  }

  const data = { ...this.medicine };

  if (this.editIndex === null) {

    this.medicineService.addMedicine(data); // ✅ NO subscribe

  } else {

    this.medicineService.updateMedicine(this.editIndex, data);

  }

  this.resetForm();
}

  editMedicine(index: number): void {

    const med = this.paginatedMedicines[index];
    const originalIndex = this.medicines.indexOf(med);

    this.editIndex = originalIndex;
    this.medicine = { ...med };
    this.showForm = true;
  }

 deleteMedicine(index: number): void {

  const med = this.paginatedMedicines[index];
  const originalIndex = this.medicines.indexOf(med);

  if (confirm(`Delete ${med.name}?`)) {

    this.medicineService.deleteMedicine(originalIndex);

  }
}

  resetForm(): void {
    this.medicine = this.createEmptyMedicine();
    this.editIndex = null;
    this.showForm = false;
  }

  /* ================= PURCHASE ================= */

  addItem(): void {

    if (!this.item.medicine || this.item.qty <= 0) {
      alert("Enter valid item");
      return;
    }

    const gstAmount = (this.item.price * this.item.gst) / 100;

    const total = (this.item.price + gstAmount) * this.item.qty;

    this.purchaseItems.push({ ...this.item, total });

    this.item = this.createEmptyItem();
  }

  removeItem(index: number): void {
    this.purchaseItems.splice(index, 1);
  }

  savePurchase(): void {

    if (!this.purchase.supplier || this.purchaseItems.length === 0) {
      alert("Add purchase items");
      return;
    }

    const totalAmount = this.purchaseItems
      .reduce((sum, i) => sum + i.total, 0);

    const order: PurchaseOrder = {
      ...this.purchase,
      items: [...this.purchaseItems],
      totalAmount,
      billFile: this.uploadedBill || undefined
    };

    this.purchaseOrders.push(order);

    this.savePurchaseOrders();
    this.resetPurchaseForm();
    this.updatePurchasePagination();
  }

  resetPurchaseForm(): void {
    this.purchase = { supplier: '', invoice: '', date: '' };
    this.purchaseItems = [];
    this.uploadedBill = null;
    this.showPurchaseForm = false;
  }
  /* ================= PURCHASE EDIT ================= */

editPurchase(index: number): void {

  const order = this.purchaseOrders[index];

  this.purchase = {
    supplier: order.supplier,
    invoice: order.invoice,
    date: order.date
  };

  this.purchaseItems = [...order.items];

  this.editPurchaseIndex = index;

  this.showPurchaseForm = true;
}


/* ================= PURCHASE DELETE ================= */

deletePurchase(index: number): void {

  if (!confirm("Delete this purchase order?")) return;

  this.purchaseOrders.splice(index, 1);

  this.savePurchaseOrders();

  this.updatePurchasePagination();
}

  /* ================= FILE ================= */

  uploadBill(event: any): void {

    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      this.uploadedBill = reader.result as string;
    };

    reader.readAsDataURL(file);
  }

  viewBill(order: PurchaseOrder): void {
    if (!order.billFile) return;
    window.open(order.billFile, '_blank');
  }

  downloadBill(order: PurchaseOrder): void {

    if (!order.billFile) return;

    const link = document.createElement('a');
    link.href = order.billFile;
    link.download = 'purchase-bill';
    link.click();
  }

  /* ================= SEARCH ================= */

  searchMedicine(): void {
    this.applyFilter();
  }

  applyFilter(): void {

    const text = this.searchText.toLowerCase();

    this.filteredMedicines = !text
      ? [...this.medicines]
      : this.medicines.filter(m =>
          m.name.toLowerCase().includes(text) ||
          m.generic.toLowerCase().includes(text) ||
          m.manufacturer.toLowerCase().includes(text)
        );

    this.currentPage = 1;
    this.updatePagination();
  }

  /* ================= EXPIRY ================= */

  isExpired(date: string): boolean {
    return date ? new Date(date) < new Date() : false;
  }

  isExpiringSoon(date: string): boolean {

    if (!date) return false;

    const diff =
      new Date(date).getTime() - new Date().getTime();

    const days = diff / (1000 * 3600 * 24);

    return days > 0 && days <= 30;
  }

  trackByIndex(index: number): number {
    return index;
  }
}