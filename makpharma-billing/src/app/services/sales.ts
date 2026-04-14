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
    this.loadInvoices();
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
     LOAD INVOICES
  ======================================== */

  loadInvoices(): void {

    const token = localStorage.getItem('token');

    if (!token) {
      console.warn("⚠️ No token, skipping invoice load");
      return;
    }

    this.http.get<any>(this.baseUrl, this.getHeaders())
      .pipe(

        tap((res: any) => {

          const data = Array.isArray(res?.data) ? res.data : [];

          const formatted = data.map((b: any) => ({

            _id: b._id,

            invoiceNumber: b.invoiceNumber || 'MISSING-INVOICE',

            customer: {
              name: b.customerName || b.customer?.name || '',
              phone: b.customerPhone || b.customer?.phone || '',
              state: b.customerState || b.customer?.state || 'Tamil Nadu',
              gst: b.customerGST || b.customer?.gst || ''
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
                  total: Number(
                    item.total ||
                    (item.qty * (item.sellingPrice || item.price || 0))
                  )
                }))
              : []

          }));

          console.log("✅ Loaded Invoices:", formatted);

          this.invoicesSubject.next(formatted);

        }),

        catchError((error) => {
          console.error("❌ Load Error:", error);
          return throwError(() => error);
        })

      )
      .subscribe();
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

    const billData = this.formatInvoiceData(invoice);

    return this.http.post(`${this.baseUrl}/add`, billData, this.getHeaders())
      .pipe(

        tap(() => {
          console.log("✅ Invoice saved:", billData.invoiceNumber);
          this.loadInvoices();
        }),

        catchError((error) => {
          console.error("❌ Add Invoice Error:", error);
          return throwError(() => error);
        })

      );
  }

  /* ========================================
     🔥 UPDATE INVOICE (NEW - IMPORTANT)
  ======================================== */

  updateInvoice(id: string, invoice: any): Observable<any> {

    if (!id) {
      return throwError(() => new Error("Invalid ID"));
    }

    const billData = this.formatInvoiceData(invoice);

    return this.http.put(`${this.baseUrl}/${id}`, billData, this.getHeaders())
      .pipe(

        tap(() => {
          console.log("✅ Invoice updated:", id);
          this.loadInvoices();
        }),

        catchError((error) => {
          console.error("❌ Update Error:", error);
          return throwError(() => error);
        })

      );
  }

  /* ========================================
     DELETE INVOICE
  ======================================== */

  deleteInvoice(id: string): Observable<any> {

    if (!id) {
      return throwError(() => new Error("Invalid ID"));
    }

    return this.http.delete(`${this.baseUrl}/${id}`, this.getHeaders())
      .pipe(

        tap(() => {
          console.log("✅ Invoice deleted:", id);
          this.loadInvoices();
        }),

        catchError((error) => {
          console.error("❌ Delete Error:", error);
          return throwError(() => error);
        })

      );
  }

  /* ========================================
     🔥 COMMON FORMATTER (PRO LEVEL)
  ======================================== */

  private formatInvoiceData(invoice: any) {

    return {

      invoiceNumber: invoice.invoiceNumber,

      customerName: invoice.customer?.name || invoice.customerName || '',
      customerPhone: invoice.customer?.phone || invoice.customerPhone || '',
      customerState: invoice.customer?.state || invoice.customerState || 'Tamil Nadu',
      customerGST: invoice.customer?.gst || invoice.customerGST || '',

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
  }

  /* ========================================
     GET LAST INVOICE
  ======================================== */

  getLastInvoice(): any {
    const data = this.getInvoices();
    return data.length ? data[data.length - 1] : null;
  }

}