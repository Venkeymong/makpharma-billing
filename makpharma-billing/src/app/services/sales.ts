import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
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

  /* ================= HELPER (TOKEN) ================= */

  private getHeaders() {
    const token = localStorage.getItem('token');

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  /* ========================================
     LOAD INVOICES FROM BACKEND
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
            price: item.price,
            gst: item.gst,
            hsn: item.hsn || '-',
            total: item.total || (item.qty * item.price)
          }))

        }));

        console.log("✅ Loaded Invoices:", formatted);

        this.invoicesSubject.next(formatted);
      },

      error: (err) => {
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
     ADD INVOICE
  ======================================== */

  addInvoice(invoice: any): void {

    const billData = {

      invoiceNumber: invoice.invoiceNumber,

      customerName: invoice.customer?.name,
      customerPhone: invoice.customer?.phone,
      customerState: invoice.customer?.state,
      customerGST: invoice.customer?.gst,

      date: invoice.date,

      items: (invoice.items || []).map((item: any) => ({
        medicine: item.name,
        qty: item.qty,
        price: item.price,
        gst: item.gst,
        hsn: item.hsn,
        total: item.qty * item.price
      })),

      subtotal: invoice.subtotal,
      cgst: invoice.cgstTotal,
      sgst: invoice.sgstTotal,
      igst: invoice.igstTotal,
      totalAmount: invoice.total,

      paymentMethod: invoice.paymentMethod || "Cash"
    };

    this.http.post(this.baseUrl + '/add', billData, this.getHeaders()).subscribe({

      next: () => {
        console.log("✅ Invoice saved:", billData.invoiceNumber);
        this.loadInvoices();
      },

      error: (err) => {
        console.error("❌ Add Error:", err);
      }

    });
  }

  /* ========================================
     DELETE INVOICE
  ======================================== */

  deleteInvoice(id: string): void {

    console.log("🗑️ Deleting ID:", id);

    if (!id) {
      console.error("❌ Invalid ID");
      return;
    }

    this.http.delete(`${this.baseUrl}/${id}`, this.getHeaders()).subscribe({

      next: () => {
        console.log("✅ Invoice deleted");
        this.loadInvoices();
      },

      error: (err) => {
        console.error("❌ Delete Error:", err);
      }

    });
  }

  /* ========================================
     GET LAST INVOICE
  ======================================== */

  getLastInvoice(): any {
    const data = this.getInvoices();
    return data.length ? data[data.length - 1] : null;
  }

}