import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
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

    this.http.get<any[]>(this.baseUrl, this.getHeaders()).subscribe({

      next: (data) => {

        const formatted = (data || []).map((b: any) => ({

          _id: b._id,

          invoiceNumber: b.invoiceNumber || 'MISSING-INVOICE',

          customer: {
            name: b.customerName || 'Walk-in',
            phone: b.customerPhone || '-',
            state: b.customerState || 'Tamil Nadu',
            gst: b.customerGST || ''
          },

          date: b.date ? new Date(b.date) : new Date(),

          subtotal: b.subtotal || 0,
          total: b.totalAmount || 0,

          cgst: b.cgst || 0,
          sgst: b.sgst || 0,
          igst: b.igst || 0,

          payment: b.paymentMethod || 'Cash',

          items: (b.items || []).map((item: any) => ({
            name: item.medicine,
            qty: item.qty,
            price: item.sellingPrice || item.price, // 🔥 FIX (show selling)
            gst: item.gst,
            hsn: item.hsn || '-',
            total: item.total || (item.qty * (item.sellingPrice || item.price))
          }))

        }));

        console.log("✅ Loaded Invoices:", formatted);

        this.invoicesSubject.next(formatted);
      },

      error: (err: any) => {
        console.error("❌ Load Error:", err);
      }

    });
  }

  /* ========================================
     GET CURRENT VALUE
  ======================================== */

  getInvoices(): any[] {
    return this.invoicesSubject.value || [];
  }

  /* ========================================
     ADD INVOICE (FIXED)
  ======================================== */

  addInvoice(invoice: any): Observable<any> {

    const billData = {

      invoiceNumber: invoice.invoiceNumber,

      customerName: invoice.customer?.name,
      customerPhone: invoice.customer?.phone,
      customerState: invoice.customer?.state,
      customerGST: invoice.customer?.gst,

      date: invoice.date,

      items: (invoice.items || []).map((item: any) => ({
        medicine: item.medicine || item.name,
        batch: item.batch || '',
        qty: item.qty,

        price: item.price || 0,
        sellingPrice: item.sellingPrice || item.price || 0,

        gst: item.gst || 0,
        total: item.qty * (item.sellingPrice || item.price || 0)
      })),

      subtotal: invoice.subtotal || 0,
      cgst: invoice.cgstTotal || 0,
      sgst: invoice.sgstTotal || 0,
      igst: invoice.igstTotal || 0,

      totalAmount: invoice.totalAmount || invoice.total || 0,

      paymentMethod: invoice.paymentMethod || "Cash"
    };

    return this.http.post(this.baseUrl + '/add', billData, this.getHeaders()).pipe(

      tap(() => {
        console.log("✅ Invoice saved:", billData.invoiceNumber);
        this.loadInvoices(); // refresh list
      })

    );
  }

  /* ========================================
     DELETE INVOICE
  ======================================== */

  deleteInvoice(id: string): Observable<any> {

    if (!id) {
      console.error("❌ Invalid ID");
      throw new Error("Invalid ID");
    }

    return this.http.delete(`${this.baseUrl}/${id}`, this.getHeaders()).pipe(

      tap(() => {
        console.log("✅ Invoice deleted");
        this.loadInvoices();
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