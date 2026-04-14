import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SalesService {

  private baseUrl = 'https://makpharma-billing-final.onrender.com/api/bills';

  private invoicesSubject = new BehaviorSubject<any[]>([]);
  invoices$ = this.invoicesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadInvoices(); // ✅ kept (no logic change)
  }

  /* ================= TOKEN ================= */

  private getHeaders() {
    const token = localStorage.getItem('token');

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token || ''}`
      })
    };
  }

  /* ========================================
     LOAD INVOICES (SAFE FIX)
  ======================================== */

  loadInvoices(): void {

    const token = localStorage.getItem('token');

    /* 🔥 FIX: prevent empty load on refresh */
    if (!token) {
      console.warn("⚠️ No token, skipping invoice load");
      return;
    }

    this.http.get<any>(this.baseUrl, this.getHeaders()).pipe(

      tap((res: any) => {

        const data = Array.isArray(res?.data) ? res.data : [];

        const formatted = data.map((b: any) => ({

          _id: b._id,

          invoiceNumber: b.invoiceNumber || 'MISSING-INVOICE',

          customer: {
            name: b.customerName || 'Walk-in',
            phone: b.customerPhone || '-',
            state: b.customerState || 'Tamil Nadu',
            gst: b.customerGST || ''
          },

          date: b.date ? new Date(b.date) : new Date(),

          subtotal: Number(b.subtotal || 0),
          total: Number(b.totalAmount || 0),

          cgst: Number(b.cgst || 0),
          sgst: Number(b.sgst || 0),
          igst: Number(b.igst || 0),

          payment: b.paymentMethod || 'Cash',

          items: Array.isArray(b.items) ? b.items.map((item: any) => ({
            name: item.medicine,
            qty: Number(item.qty || 0),
            price: Number(item.sellingPrice || item.price || 0),
            gst: Number(item.gst || 0),
            hsn: item.hsn || '-',
            total: Number(item.total || (item.qty * (item.sellingPrice || item.price || 0)))
          })) : []

        }));

        console.log("✅ Loaded Invoices:", formatted);

        this.invoicesSubject.next(formatted);

      }),

      catchError((err) => {
        console.error("❌ Load Error:", err);
        return throwError(() => err);
      })

    ).subscribe();
  }

  /* ========================================
     GET CURRENT VALUE
  ======================================== */

  getInvoices(): any[] {
    return this.invoicesSubject.value || [];
  }

  /* ========================================
     ADD INVOICE
  ======================================== */

  addInvoice(invoice: any): Observable<any> {

    const billData = {

      invoiceNumber: invoice.invoiceNumber,

      customerName: invoice.customer?.name || 'Walk-in',
      customerPhone: invoice.customer?.phone || '-',
      customerState: invoice.customer?.state || 'Tamil Nadu',
      customerGST: invoice.customer?.gst || '',

      date: invoice.date || new Date(),

      items: Array.isArray(invoice.items) ? invoice.items.map((item: any) => ({
        medicine: item.medicine || item.name,
        batch: item.batch || '',
        qty: Number(item.qty || 0),

        price: Number(item.price || 0),
        sellingPrice: Number(item.sellingPrice || item.price || 0),

        gst: Number(item.gst || 0),
        total: Number(item.qty || 0) * Number(item.sellingPrice || item.price || 0)
      })) : [],

      subtotal: Number(invoice.subtotal || 0),
      cgst: Number(invoice.cgstTotal || 0),
      sgst: Number(invoice.sgstTotal || 0),
      igst: Number(invoice.igstTotal || 0),

      totalAmount: Number(invoice.totalAmount || invoice.total || 0),

      paymentMethod: invoice.paymentMethod || "Cash"
    };

    console.log("🚀 BILL DATA:", billData);

    return this.http.post(`${this.baseUrl}/add`, billData, this.getHeaders()).pipe(

      tap(() => {
        console.log("✅ Invoice saved:", billData.invoiceNumber);
        this.loadInvoices(); // 🔥 refresh
      }),

      catchError((err) => {
        console.error("❌ Add Invoice Error:", err);
        return throwError(() => err);
      })

    );
  }

  /* ========================================
     DELETE INVOICE
  ======================================== */

  deleteInvoice(id: string): Observable<any> {

    if (!id) {
      console.error("❌ Invalid ID");
      return throwError(() => new Error("Invalid ID"));
    }

    console.log("🗑️ Deleting Invoice:", id);

    return this.http.delete(`${this.baseUrl}/${id}`, this.getHeaders()).pipe(

      tap(() => {
        console.log("✅ Invoice deleted:", id);
        this.loadInvoices(); // 🔥 refresh list
      }),

      catchError((err) => {
        console.error("❌ Delete Error:", err);
        return throwError(() => err);
      })

    );
  }

  /* ========================================
     GET LAST INVOICE
  ======================================== */

  getLastInvoice(): any {
    const data = this.getInvoices();
    return data.length ? data[data.length - 1] : null;
  }

}