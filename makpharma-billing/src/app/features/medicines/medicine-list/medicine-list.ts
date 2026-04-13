import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MedicineService } from '../../../services/medicine';
import { AuthService } from '../../../services/auth';
import { Subscription } from 'rxjs';

/* ================= INTERFACES ================= */

export interface Medicine {
  _id?: string;
  name: string;
  batch?: string;
  hsn?: string;
  expiry?: string;
  price: number;
  sellingPrice: number;
  mrp?: number;
  gst?: number;
  stock: number;
}

export interface PurchaseItem {
  medicine: string;
  hsn: string;
  batch: string;
  expiry: string;
  qty: number;
  price: number;
  sellingPrice: number;
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
export class MedicineList implements OnInit, OnDestroy {

  constructor(
    private medicineService: MedicineService,
    public auth: AuthService
  ) {}

  private sub = new Subscription();

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

  /* 🔐 AUTH */
  showAuthModal = false;
  authAction: string | null = null;

  selectedId: string | null = null;
  selectedIndex: number | null = null;

  /* PAGINATION */
  currentPage = 1;
  itemsPerPage = 10;

  purchaseCurrentPage = 1;
  purchaseItemsPerPage = 10;

  editingPurchaseIndex: number | null = null;

  /* ================= INIT ================= */

  ngOnInit(): void {

    this.sub.add(
      this.medicineService.medicines$.subscribe((data: any[]) => {

        this.medicines = (data || []).map((m: any) => ({
          _id: m._id,
          name: m.name || '',
          batch: m.batch || '',
          hsn: m.hsn || '',
          expiry: m.expiry || '',
          price: Number(m.price) || 0,
          sellingPrice: Number(m.sellingPrice ?? m.price) || 0,
          mrp: Number(m.mrp ?? m.sellingPrice ?? m.price) || 0,
          gst: Number(m.gst) || 0,
          stock: Number(m.stock) || 0
        }));

        this.applyFilter();
      })
    );

    this.loadPurchaseOrders();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  /* ================= ITEMS ================= */

  createEmptyItem(): PurchaseItem {
    return {
      medicine: '',
      hsn: '',
      batch: '',
      expiry: '',
      qty: 0,
      price: 0,
      sellingPrice: 0,
      gst: 0,
      total: 0
    };
  }

  addItem(): void {
    if (!this.item.medicine || this.item.qty <= 0) return;

    const gstAmount = (this.item.price * this.item.gst) / 100;
    const total = (this.item.price + gstAmount) * this.item.qty;

    this.purchaseItems.push({ ...this.item, total });
    this.item = this.createEmptyItem();
  }

  removeItem(index: number): void {
    this.purchaseItems.splice(index, 1);
  }

  /* ================= PURCHASE ================= */

  savePurchase(): void {

    if (!this.purchase.supplier || this.purchaseItems.length === 0) return;

    const totalAmount = this.purchaseItems.reduce((sum, i) => sum + i.total, 0);

    const order: PurchaseOrder = {
      ...this.purchase,
      items: [...this.purchaseItems],
      totalAmount,
      billFile: this.uploadedBill || undefined
    };

    this.purchaseItems.forEach(item => {

      const existing = this.medicines.find(m =>
        m.name.toLowerCase() === item.medicine.toLowerCase() &&
        m.batch === item.batch
      );

      if (existing && existing._id) {

        this.medicineService.updateMedicine(existing._id, {
          ...existing,
          price: item.price,
          sellingPrice: item.sellingPrice,
          stock: existing.stock + item.qty
        }).subscribe();

      } else {

        this.medicineService.addMedicine({
          name: item.medicine,
          batch: item.batch,
          hsn: item.hsn,
          expiry: item.expiry,
          price: item.price,
          sellingPrice: item.sellingPrice,
          gst: item.gst,
          stock: item.qty
        }).subscribe();
      }

    });

  let requests: any[] = [];

this.purchaseItems.forEach(item => {

  const existing = this.medicines.find(m =>
    m.name.toLowerCase() === item.medicine.toLowerCase() &&
    m.batch === item.batch
  );

  if (existing && existing._id) {

    requests.push(
      this.medicineService.updateMedicine(existing._id, {
        ...existing,
        price: item.price,
        sellingPrice: item.sellingPrice,
        stock: existing.stock + item.qty
      })
    );

  } else {

    requests.push(
      this.medicineService.addMedicine({
        name: item.medicine,
        batch: item.batch,
        hsn: item.hsn,
        expiry: item.expiry,
        price: item.price,
        sellingPrice: item.sellingPrice,
        gst: item.gst,
        stock: item.qty
      })
    );
  }
});

/* 🔥 WAIT FOR ALL API CALLS */
Promise.all(requests.map(req => req.toPromise()))
  .then(() => {
    this.medicineService.loadMedicines(); // ✅ refresh UI
  })
  .catch(err => console.error(err));

    if (this.editingPurchaseIndex !== null) {
      this.purchaseOrders[this.editingPurchaseIndex] = order;
    } else {
      this.purchaseOrders.push(order);
    }

    this.savePurchaseOrders();
    this.resetPurchaseForm();
  }

  /* ================= AUTH FLOW ================= */

  openAuthModal(action: string, value: any): void {

    this.authAction = action;

    if (action.includes('Medicine')) {
      this.selectedId = value;
    } else {
      this.selectedIndex = value;
    }

    this.showAuthModal = true;
  }

  verifyAdmin(): void {

    switch (this.authAction) {

      case 'deleteMedicine':
        if (this.selectedId) {
          this.medicineService.deleteMedicine(this.selectedId).subscribe();
        }
        break;

      case 'editMedicine':
        if (this.selectedId) {
          const med = this.medicines.find(m => m._id === this.selectedId);
          if (med) {
            this.purchaseItems = [{
              medicine: med.name,
              batch: med.batch || '',
              hsn: med.hsn || '',
              expiry: med.expiry || '',
              qty: med.stock,
              price: med.price,
              sellingPrice: med.sellingPrice,
              gst: med.gst || 0,
              total: 0
            }];
            this.showPurchaseForm = true;
          }
        }
        break;

      case 'deletePurchase':
        if (this.selectedIndex !== null) {
          this.purchaseOrders.splice(this.selectedIndex, 1);
          this.savePurchaseOrders();
        }
        break;

      case 'editPurchase':
        if (this.selectedIndex !== null) {
          this.editPurchase(this.selectedIndex);
        }
        break;
    }

    this.closeAuthModal();
  }

  closeAuthModal(): void {
    this.showAuthModal = false;
    this.selectedId = null;
    this.selectedIndex = null;
  }

  /* ================= PURCHASE STORAGE ================= */

  loadPurchaseOrders(): void {
    this.purchaseOrders = JSON.parse(localStorage.getItem('purchaseOrders') || '[]');
  }

  savePurchaseOrders(): void {
    localStorage.setItem('purchaseOrders', JSON.stringify(this.purchaseOrders));
  }

  /* ================= FILTER ================= */

  applyFilter(): void {
    const text = this.searchText.toLowerCase();

    this.filteredMedicines = this.medicines.filter(m =>
      m.name.toLowerCase().includes(text)
    );

    this.paginatedMedicines = this.filteredMedicines;
    this.paginatedPurchaseOrders = this.purchaseOrders;
  }

  /* ================= HELPERS ================= */

  isExpired(date?: string): boolean {
    return date ? new Date(date) < new Date() : false;
  }

  isExpiringSoon(date?: string): boolean {
    if (!date) return false;
    const diff = new Date(date).getTime() - Date.now();
    const days = diff / (1000 * 3600 * 24);
    return days > 0 && days <= 30;
  }

  uploadBill(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.uploadedBill = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  editPurchase(index: number): void {

  const order = this.purchaseOrders[index];
  if (!order) return;

  this.purchase = {
    supplier: order.supplier,
    invoice: order.invoice,
    date: order.date
  };

  this.purchaseItems = [...order.items];

  this.uploadedBill = order.billFile || null;

  this.editingPurchaseIndex = index;

  this.showPurchaseForm = true;
} 
resetPurchaseForm(): void {

  this.purchase = {
    supplier: '',
    invoice: '',
    date: ''
  };

  this.purchaseItems = [];
  this.item = this.createEmptyItem();

  this.uploadedBill = null;

  this.editingPurchaseIndex = null;

  this.showPurchaseForm = false;
}
}