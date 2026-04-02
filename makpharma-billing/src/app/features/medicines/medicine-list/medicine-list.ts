import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MedicineService } from '../../../services/medicine';
import { AuthService } from '../../../services/auth';

/* ================= MODELS ================= */

export interface Medicine {
  name: string;
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
  expiry: string;
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

  constructor(
    private medicineService: MedicineService,
    public auth: AuthService
  ) {}

  /* ================= STATE ================= */

  searchText = '';
  showPurchaseForm = false;

  medicines: Medicine[] = [];
  filteredMedicines: Medicine[] = [];
  paginatedMedicines: Medicine[] = [];

  purchaseOrders: PurchaseOrder[] = [];
  paginatedPurchaseOrders: PurchaseOrder[] = [];

  purchase = { supplier: '', invoice: '', date: '' };

  purchaseItems: PurchaseItem[] = [];
  item: PurchaseItem = this.createEmptyItem();

  uploadedBill: string | null = null;

  /* 🔐 AUTH MODAL STATE */

  showAuthModal = false;
  authAction: string | null = null;
  selectedIndex: number | null = null;
  adminPasswordInput = '';

  /* ================= PAGINATION ================= */

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  pages: number[] = [];

  purchaseCurrentPage = 1;
  purchaseItemsPerPage = 10;
  purchaseTotalPages = 1;
  purchasePages: number[] = [];

  /* ================= INIT ================= */

  ngOnInit(): void {
    this.medicineService.medicines$.subscribe(data => {
      this.medicines = data;
      this.applyFilter();
    });

    this.loadPurchaseOrders();
  }

  /* ================= FACTORY ================= */

  createEmptyItem(): PurchaseItem {
    return {
      medicine: '',
      hsn: '',
      batch: '',
      expiry: '',
      qty: 0,
      price: 0,
      gst: 0,
      total: 0
    };
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

    const totalAmount = this.purchaseItems.reduce((sum, i) => sum + i.total, 0);

    const order: PurchaseOrder = {
      ...this.purchase,
      items: [...this.purchaseItems],
      totalAmount,
      billFile: this.uploadedBill || undefined
    };

    this.purchaseItems.forEach(item => {

      const index = this.medicines.findIndex(m =>
        m.name.toLowerCase() === item.medicine.toLowerCase() &&
        m.batch === item.batch
      );

      if (index !== -1) {

        const existing = this.medicines[index];

        existing.stock += item.qty;
        existing.hsn = item.hsn;
        existing.gst = item.gst;
        existing.sellingPrice = item.price;
        existing.expiry = item.expiry;

        this.medicineService.updateMedicine(index, existing);

      } else {

        const newMed: Medicine = {
          name: item.medicine,
          hsn: item.hsn,
          batch: item.batch,
          expiry: item.expiry,
          mrp: item.price,
          sellingPrice: item.price,
          gst: item.gst,
          stock: item.qty
        };

        this.medicineService.addMedicine(newMed);
      }
    });

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

  /* ================= STORAGE ================= */

  loadPurchaseOrders(): void {
    this.purchaseOrders = JSON.parse(localStorage.getItem('purchaseOrders') || '[]');
    this.updatePurchasePagination();
  }

  savePurchaseOrders(): void {
    localStorage.setItem('purchaseOrders', JSON.stringify(this.purchaseOrders));
  }

  /* ================= PAGINATION ================= */

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredMedicines.length / this.itemsPerPage);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    this.setPage(1);
  }

  setPage(page: number): void {
    this.currentPage = page;
    const start = (page - 1) * this.itemsPerPage;
    this.paginatedMedicines = this.filteredMedicines.slice(start, start + this.itemsPerPage);
  }

  updatePurchasePagination(): void {
    this.purchaseTotalPages = Math.ceil(this.purchaseOrders.length / this.purchaseItemsPerPage);
    this.purchasePages = Array.from({ length: this.purchaseTotalPages }, (_, i) => i + 1);
    this.setPurchasePage(1);
  }

  setPurchasePage(page: number): void {
    this.purchaseCurrentPage = page;
    const start = (page - 1) * this.purchaseItemsPerPage;
    this.paginatedPurchaseOrders = this.purchaseOrders.slice(start, start + this.purchaseItemsPerPage);
  }

  /* ================= SEARCH ================= */

  searchMedicine(): void {
    this.applyFilter();
  }

  applyFilter(): void {
    const text = this.searchText.toLowerCase();

    this.filteredMedicines = this.medicines.filter(m =>
      m.name.toLowerCase().includes(text)
    );

    this.updatePagination();
  }

  /* ================= EXPIRY ================= */

  isExpired(date: string): boolean {
    return date ? new Date(date) < new Date() : false;
  }

  isExpiringSoon(date: string): boolean {
    if (!date) return false;
    const diff = new Date(date).getTime() - Date.now();
    const days = diff / (1000 * 3600 * 24);
    return days > 0 && days <= 30;
  }

  /* ================= AUTH MODAL ================= */

  openAuthModal(action: string, index: number): void {

    const user = this.auth.getUser();

    if (!user || user.role !== 'admin') {
      alert("Only admin allowed!");
      return;
    }

    this.authAction = action;
    this.selectedIndex = index;
    this.adminPasswordInput = '';
    this.showAuthModal = true;
  }

  verifyAdmin(): void {

    if(!this.auth.verifyActionPassword(this.adminPasswordInput)){
  alert("Wrong system password!");
  return;
}

    switch (this.authAction) {

      case 'deletePurchase':
        this.purchaseOrders.splice(this.selectedIndex!, 1);
        this.savePurchaseOrders();
        this.updatePurchasePagination();
        break;

      case 'deleteMedicine':
        const med = this.paginatedMedicines[this.selectedIndex!];
        const originalIndex = this.medicines.indexOf(med);
        this.medicineService.deleteMedicine(originalIndex);
        break;

      case 'editPurchase':
        const order = this.purchaseOrders[this.selectedIndex!];
        this.purchase = { supplier: order.supplier, invoice: order.invoice, date: order.date };
        this.purchaseItems = [...order.items];
        this.showPurchaseForm = true;
        break;

      case 'editMedicine':
        const m = this.paginatedMedicines[this.selectedIndex!];
        this.item = {
          medicine: m.name,
          hsn: m.hsn,
          batch: m.batch,
          expiry: m.expiry,
          qty: 1,
          price: m.sellingPrice,
          gst: m.gst,
          total: 0
        };
        this.showPurchaseForm = true;
        break;
    }

    this.closeAuthModal();
  }

  closeAuthModal(): void {
    this.showAuthModal = false;
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
}