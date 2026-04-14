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
    this.loadInvoices(); // ✅ no logic change
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
     LOAD INVOICES (🔥 FIXED CUSTOMER ISSUE)
  ======================================== */

  loadInvoices(): void {

    const token = localStorage.getItem('token');

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

          /* 🔥 FINAL FIX (NO WALK-IN + SUPPORT BOTH FORMATS) */
          customer: {
            name:
              b.customerName ||
              b.customer?.name ||
              '',

            phone:
              b.customerPhone ||
              b.customer?.phone ||
              '',

            state:
              b.customerState ||
              b.customer?.state ||
              'Tamil Nadu',

            gst:
              b.customerGST ||
              b.customer?.gst ||
              ''
          },

          date: b.date ? new Date(b.date) : new Date(),

          subtotal: Number(b.subtotal || 0),
          total: Number(b.totalAmount || 0),

          cgst: Number(b.cgst || 0),
          sgst: Number(b.sgst || 0),
          igst: Number(b.igst || 0),

          payment: b.paymentMethod || 'Cash',

          items: Array.isArray(b.items)
            ? b.items.map((item: any) => ({
                name: item.medicine,
                qty: Number(item.qty || 0),
                price: Number(item.sellingPrice || item.price || 0),
                gst: Number(item.gst || 0),
                hsn: item.hsn || '-',
                total: Number(item.total || (item.qty * (item.sellingPrice || item.price || 0)))
              }))
            : []

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
     ADD INVOICE (🔥 SAFE FIX)
  ======================================== */

  addInvoice(invoice: any): Observable<any> {

    const billData = {

      invoiceNumber: invoice.invoiceNumber,

      /* 🔥 SUPPORT BOTH STRUCTURES */
      customerName:
        invoice.customer?.name ||
        invoice.customerName ||
        '',

      customerPhone:
        invoice.customer?.phone ||
        invoice.customerPhone ||
        '',

      customerState:
        invoice.customer?.state ||
        invoice.customerState ||
        'Tamil Nadu',

      customerGST:
        invoice.customer?.gst ||
        invoice.customerGST ||
        '',

      date: invoice.date || new Date(),

      items: Array.isArray(invoice.items)
        ? invoice.items.map((item: any) => {

            const price = Number(item.price || item.sellingPrice || 1);
            const qty = Number(item.qty || 1);

            return {
              medicine: item.medicine || item.name || '',
              batch: item.batch || '',
              qty,

              price,
              sellingPrice: price,

              gst: Number(item.gst || 0),
              total: qty * price
            };
          })
        : [],

      subtotal: Number(invoice.subtotal || 0),
      cgst: Number(invoice.cgstTotal || invoice.cgst || 0),
      sgst: Number(invoice.sgstTotal || invoice.sgst || 0),
      igst: Number(invoice.igstTotal || invoice.igst || 0),

      totalAmount: Number(invoice.totalAmount || invoice.total || 0),

      paymentMethod: invoice.paymentMethod || invoice.payment || "Cash"
    };

    console.log("🚀 FINAL BILL DATA:", billData);

    return this.http.post(`${this.baseUrl}/add`, billData, this.getHeaders()).pipe(

      tap(() => {
        console.log("✅ Invoice saved:", billData.invoiceNumber);
        this.loadInvoices();
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
        this.loadInvoices();
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