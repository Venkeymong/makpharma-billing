import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicineService } from '../../../services/medicine';
import { SalesService } from '../../../services/sales';
import { Chart } from 'chart.js/auto';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, OnDestroy {

  /* ================= DATA ================= */

  medicines: any[] = [];
  invoices: any[] = [];

  /* ================= FILTERED ================= */

  lowStockList: any[] = [];
  expirySoonList: any[] = [];

  /* ================= KPI ================= */

  totalMedicines = 0;
  lowStock = 0;
  expirySoon = 0;

  totalSales = 0;
  todaySales = 0;

  inventoryValue = 0;
  todayInvoices = 0;
  averageDailySales = 0;

  /* ================= UI ================= */

  showAlert = false;
  alertTriggered = false;

  /* ================= CHARTS (FIXED TYPE) ================= */

  salesChart: any;
  stockChart: any;
  topMedicineChart: any;
  performanceChart: any;

  /* ================= SUBS ================= */

  private sub = new Subscription();
  private chartTimeout: any;

  constructor(
    private medicineService: MedicineService,
    private salesService: SalesService
  ) {}

  /* ================= INIT ================= */

  ngOnInit(): void {

    this.sub.add(
      this.medicineService.medicines$.subscribe(data => {
        this.medicines = data || [];
        this.updateDashboard();
      })
    );

    this.sub.add(
      this.salesService.invoices$.subscribe(data => {
        this.invoices = data || [];
        this.updateDashboard();
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.destroyCharts();
    clearTimeout(this.chartTimeout);
  }

  /* ================= MAIN ================= */

  updateDashboard(): void {

    if (!this.medicines || !this.invoices) return;

    /* SORT */
    this.invoices = [...this.invoices].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    /* FILTER */
    this.lowStockList = this.medicines.filter(m => m.stock < 10);
    this.expirySoonList = this.medicines.filter(m => this.isExpiringSoon(m.expiry));

    /* KPI */

    this.totalMedicines = this.medicines.length;
    this.lowStock = this.lowStockList.length;
    this.expirySoon = this.expirySoonList.length;

    this.totalSales = this.invoices.reduce(
      (sum, i) => sum + (i.total || 0), 0
    );

    const todayStr = new Date().toDateString();

    this.todaySales = this.invoices
      .filter(i => new Date(i.date).toDateString() === todayStr)
      .reduce((sum, i) => sum + (i.total || 0), 0);

    this.inventoryValue = this.medicines.reduce(
      (sum, m) => sum + ((m.stock || 0) * (m.sellingPrice || 0)), 0
    );

    this.todayInvoices = this.invoices.filter(
      i => new Date(i.date).toDateString() === todayStr
    ).length;

    /* AVERAGE */

    if (this.invoices.length > 0) {

      const firstDate = new Date(this.invoices[0].date);
      const now = new Date();

      const days = Math.max(
        1,
        Math.ceil((now.getTime() - firstDate.getTime()) / (1000 * 3600 * 24))
      );

      this.averageDailySales = Math.round(this.totalSales / days);
    }

    /* ALERT */

    if (this.lowStock > 0 && !this.alertTriggered) {
      this.triggerAlert();
      this.alertTriggered = true;
    }

    /* CHART RENDER */

    clearTimeout(this.chartTimeout);

    this.chartTimeout = setTimeout(() => {
      this.renderCharts();
    }, 150);
  }

  /* ================= ALERT ================= */

  triggerAlert(): void {

    this.showAlert = true;

    const audio = new Audio(
      'https://actions.google.com/sounds/v1/alarms/beep_short.ogg'
    );
    audio.play();

    setTimeout(() => {
      this.showAlert = false;
    }, 3000);
  }

  /* ================= HELPERS ================= */

  isExpiringSoon(expiryDate: string): boolean {

    if (!expiryDate) return false;

    const today = new Date();
    const expiry = new Date(expiryDate);

    const days = (expiry.getTime() - today.getTime()) / (1000 * 3600 * 24);

    return days < 30 && days > 0;
  }

  /* ================= CHARTS ================= */

  renderCharts(): void {
    this.destroyCharts();

    this.createSalesChart();
    this.createStockChart();
    this.createTopMedicineChart();
    this.createPerformanceChart();
  }

  destroyCharts(): void {
    this.salesChart?.destroy();
    this.stockChart?.destroy();
    this.topMedicineChart?.destroy();
    this.performanceChart?.destroy();
  }

  /* ================= SALES ================= */

  createSalesChart(): void {

    const monthlyData: number[] = new Array(12).fill(0);

    this.invoices.forEach(i => {
      const d = new Date(i.date);
      monthlyData[d.getMonth()] += (i.total || 0);
    });

    this.salesChart = new Chart("salesChart", {
      type: 'line',
      data: {
        labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        datasets: [{
          data: monthlyData,
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56,189,248,0.2)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  /* ================= STOCK ================= */

  createStockChart(): void {

    this.stockChart = new Chart("stockChart", {
      type: 'doughnut',
      data: {
        labels: ['Normal','Low','Expiry'],
        datasets: [{
          data: [
            this.totalMedicines - this.lowStock - this.expirySoon,
            this.lowStock,
            this.expirySoon
          ],
          backgroundColor: ['#22c55e','#ef4444','#f59e0b']
        }]
      },
      options: { responsive: true }
    });
  }

  /* ================= TOP MEDICINE ================= */

  createTopMedicineChart(): void {

    const map: any = {};

    this.invoices.forEach(inv => {
      (inv.items || []).forEach((item: any) => {
        map[item.name] = (map[item.name] || 0) + (item.qty || 0);
      });
    });

    const sorted: [string, number][] =
      Object.entries(map) as [string, number][];

    const top = sorted
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    this.topMedicineChart = new Chart("topMedicineChart", {
      type: 'bar',
      data: {
        labels: top.length ? top.map(x => x[0]) : ['No Data'],
        datasets: [{
          data: top.length ? top.map(x => x[1]) : [0],
          backgroundColor: '#8b5cf6'
        }]
      },
      options: { responsive: true }
    });
  }

  /* ================= PERFORMANCE ================= */

  createPerformanceChart(): void {

    this.performanceChart = new Chart("performanceChart", {
      type: 'radar',
      data: {
        labels: ['Revenue','Stock','Sales','Invoices','Growth'],
        datasets: [{
          data: [
            this.totalSales ? 80 : 20,
            this.totalMedicines ? 70 : 20,
            this.todaySales ? 85 : 30,
            this.todayInvoices ? 60 : 20,
            this.averageDailySales ? 75 : 25
          ],
          backgroundColor: 'rgba(99,102,241,0.2)',
          borderColor: '#6366f1'
        }]
      },
      options: { responsive: true }
    });
  }

}