import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MedicineService } from '../../../services/medicine';
import { AuthService } from '../../../services/auth';
import { Subscription, forkJoin } from 'rxjs';

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

  medicines: any[] = [];
  filteredMedicines: any[] = [];
  paginatedMedicines: any[] = [];

  purchaseOrders: any[] = [];
  paginatedPurchaseOrders: any[] = [];

  purchaseItems: any[] = [];
  item: any = this.createEmptyItem();

  purchase = { supplier: '', invoice: '', date: '' };
  uploadedBill: any = null;

  showPurchaseForm = false;
  editingPurchaseIndex: number | null = null;

  showAuthModal = false;
  authAction: string | null = null;
  selectedId: string | null = null;
  selectedIndex: number | null = null;

  /* ================= INIT ================= */

  ngOnInit(): void {

    this.sub.add(
      this.medicineService.medicines$.subscribe(data => {
        this.medicines = data || [];
        this.applyFilter();
      })
    );

    this.loadPurchasesFromBackend();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  /* ================= LOAD PURCHASES ================= */

  loadPurchasesFromBackend(): void {
    this.medicineService.getPurchases().subscribe({
      next: (res: any) => {

        const data = res?.data || res || [];

        this.purchaseOrders = Array.isArray(data) ? data : [];

        this.applyFilter(); // 🔥 ensures UI updates instantly

      },
      error: (err) => console.error("❌ Load purchase error:", err)
    });
  }

  /* ================= FILTER ================= */

  applyFilter(): void {
    const text = this.searchText.toLowerCase();

    this.filteredMedicines = this.medicines.filter(m =>
      m.name.toLowerCase().includes(text)
    );

    this.paginatedMedicines = this.filteredMedicines;

    // 🔥 ALWAYS SYNC PURCHASE UI
    this.paginatedPurchaseOrders = [...this.purchaseOrders];
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

  /* ================= ITEMS ================= */

  createEmptyItem() {
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

    const order = {
      ...this.purchase,
      items: [...this.purchaseItems],
      totalAmount,
      billFile: this.uploadedBill || undefined
    };

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

    if (requests.length > 0) {
      forkJoin(requests).subscribe({
        next: () => this.saveToBackend(order),
        error: err => console.error(err)
      });
    } else {
      this.saveToBackend(order);
    }
  }

  saveToBackend(order: any) {
    this.medicineService.addPurchase(order).subscribe({
      next: () => {
        this.medicineService.loadMedicines();

        this.loadPurchasesFromBackend(); // 🔥 FIX

        this.resetPurchaseForm();
      },
      error: err => console.error("❌ Save purchase error:", err)
    });
  }

  /* ================= PURCHASE ACTIONS ================= */

  deletePurchaseDirect(id: string) {
    this.medicineService.deletePurchase(id).subscribe({
      next: () => this.loadPurchasesFromBackend(),
      error: err => console.error(err)
    });
  }

  editPurchaseDirect(order: any) {

    this.purchase = {
      supplier: order.supplier,
      invoice: order.invoice,
      date: order.date
    };

    this.purchaseItems = [...order.items];
    this.uploadedBill = order.billFile || null;

    this.showPurchaseForm = true;
  }

  /* ================= AUTH ================= */

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
    this.closeAuthModal();
  }

  closeAuthModal(): void {
    this.showAuthModal = false;
  }

  /* ================= EXTRA ================= */

  uploadBill(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => this.uploadedBill = reader.result;
    reader.readAsDataURL(file);
  }

  resetPurchaseForm(): void {
    this.purchase = { supplier: '', invoice: '', date: '' };
    this.purchaseItems = [];
    this.item = this.createEmptyItem();
    this.uploadedBill = null;
    this.editingPurchaseIndex = null;
    this.showPurchaseForm = false;
  }

  /* ================= MEDICINE ACTIONS ================= */

  deleteMedicineDirect(id: string) {
    this.medicineService.deleteMedicine(id).subscribe(() => {
      this.medicineService.loadMedicines();
    });
  }

  editMedicineDirect(id: string) {
    const med = this.medicines.find(m => m._id === id);

    if (med) {
      this.purchaseItems = [{
        medicine: med.name,
        batch: med.batch,
        hsn: med.hsn,
        expiry: med.expiry,
        qty: med.stock,
        price: med.price,
        sellingPrice: med.sellingPrice,
        gst: med.gst,
        total: 0
      }];

      this.showPurchaseForm = true;
    }
  }
}