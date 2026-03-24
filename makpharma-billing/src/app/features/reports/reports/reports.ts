import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesService } from '../../../services/sales';
import { MedicineService } from '../../../services/medicine';
import { Chart } from 'chart.js/auto';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class Reports implements OnInit, OnDestroy {

  /* ================= DATA ================= */

  invoices: any[] = [];
  medicines: any[] = [];
  filteredInvoices: any[] = [];

  lowStock: any[] = [];
  expirySoon: any[] = [];
  expired: any[] = [];

  /* ================= FILTER ================= */

  reportType: string = 'daily';
  startDate: string = '';
  endDate: string = '';

  /* ================= KPI ================= */

  totalSales: number = 0;
  totalOrders: number = 0;
  avgOrderValue: number = 0;

  /* ================= CHARTS ================= */

  salesChart: any = null;
  medicineChart: any = null;

  /* ================= SUB ================= */

  sub: Subscription = new Subscription();

  constructor(
    private salesService: SalesService,
    private medicineService: MedicineService
  ) {}

  /* ================= INIT ================= */

  ngOnInit(): void {

    this.sub.add(
      this.salesService.invoices$.subscribe((data: any[]) => {
        this.invoices = data || [];
        this.generateReport();
      })
    );

    this.sub.add(
      this.medicineService.medicines$.subscribe((data: any[]) => {
        this.medicines = data || [];
        this.generateStockReports();
      })
    );

  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.destroyCharts();
  }

  /* ================= REPORT ================= */

  generateReport(): void {

    if (!this.invoices) return;

    const today = new Date();

    if (this.reportType === 'daily') {

      this.filteredInvoices = this.invoices.filter((inv: any) =>
        new Date(inv.date).toDateString() === today.toDateString()
      );

    } else if (this.reportType === 'weekly') {

      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);

      this.filteredInvoices = this.invoices.filter((inv: any) =>
        new Date(inv.date) >= weekAgo
      );

    } else if (this.reportType === 'monthly') {

      this.filteredInvoices = this.invoices.filter((inv: any) => {
        const d = new Date(inv.date);
        return d.getMonth() === today.getMonth() &&
               d.getFullYear() === today.getFullYear();
      });

    } else if (this.reportType === 'custom') {

      if (!this.startDate || !this.endDate) return;

      this.filteredInvoices = this.invoices.filter((inv: any) => {
        const d = new Date(inv.date);
        return d >= new Date(this.startDate) &&
               d <= new Date(this.endDate);
      });
    }

    this.calculateKPI();
    this.renderCharts();
  }

  /* ================= KPI ================= */

  calculateKPI(): void {

    this.totalSales = this.filteredInvoices.reduce(
      (sum: number, inv: any) => sum + (inv.total || 0), 0
    );

    this.totalOrders = this.filteredInvoices.length;

    this.avgOrderValue = this.totalOrders
      ? this.totalSales / this.totalOrders
      : 0;
  }

  /* ================= STOCK ================= */

  generateStockReports(): void {

    if (!this.medicines) return;

    const today = new Date();

    this.lowStock = this.medicines.filter((m: any) => m.stock < 10);

    this.expirySoon = this.medicines.filter((m: any) => {
      const expiry = new Date(m.expiry);
      const days = (expiry.getTime() - today.getTime()) / (1000 * 3600 * 24);
      return days <= 30 && days > 0;
    });

    this.expired = this.medicines.filter((m: any) =>
      new Date(m.expiry) < today
    );
  }

  /* ================= CHARTS ================= */

  renderCharts(): void {

    this.destroyCharts();

    setTimeout(() => {
      this.createSalesChart();
      this.createMedicineChart();
    }, 0);
  }

  destroyCharts(): void {
    this.salesChart?.destroy();
    this.medicineChart?.destroy();
  }

  createSalesChart(): void {

    this.salesChart = new Chart("salesChart", {
      type: 'bar',
      data: {
        labels: this.filteredInvoices.map((i: any) =>
          new Date(i.date).toLocaleDateString()
        ),
        datasets: [{
          label: 'Sales',
          data: this.filteredInvoices.map((i: any) => i.total || 0)
        }]
      },
      options: { responsive: true }
    });
  }

  createMedicineChart(): void {

    const map: any = {};

    this.filteredInvoices.forEach((inv: any) => {
      (inv.items || []).forEach((item: any) => {
        map[item.name] = (map[item.name] || 0) + (item.qty || 0);
      });
    });

    this.medicineChart = new Chart("medicineChart", {
      type: 'pie',
      data: {
        labels: Object.keys(map),
        datasets: [{
          data: Object.values(map)
        }]
      },
      options: { responsive: true }
    });
  }

  /* ================= CSV ================= */

  downloadFile(data: string, fileName: string): void {

    const blob = new Blob([data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
  }

  downloadCSV(): void {

    let csv = 'Invoice,Customer,Date,Total\n';

    this.filteredInvoices.forEach((inv: any) => {
      csv += `${inv.invoiceNumber},${inv.customer?.name},${inv.date},${inv.total}\n`;
    });

    this.downloadFile(csv, 'sales-report.csv');
  }

  downloadLowStockCSV(): void {

    let csv = 'Medicine,Stock\n';

    this.lowStock.forEach((m: any) => {
      csv += `${m.name},${m.stock}\n`;
    });

    this.downloadFile(csv, 'low-stock.csv');
  }

  downloadExpirySoonCSV(): void {

    let csv = 'Medicine,Expiry\n';

    this.expirySoon.forEach((m: any) => {
      csv += `${m.name},${m.expiry}\n`;
    });

    this.downloadFile(csv, 'expiry-soon.csv');
  }

  downloadExpiredCSV(): void {

    let csv = 'Medicine,Expiry\n';

    this.expired.forEach((m: any) => {
      csv += `${m.name},${m.expiry}\n`;
    });

    this.downloadFile(csv, 'expired.csv');
  }

  downloadStockCSV(): void {

    let csv = 'Medicine,Stock,Expiry\n';

    this.medicines.forEach((m: any) => {
      csv += `${m.name},${m.stock},${m.expiry}\n`;
    });

    this.downloadFile(csv, 'stock.csv');
  }

}