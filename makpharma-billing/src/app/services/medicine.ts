import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, throwError, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

/* =========================================
   INTERFACE
========================================= */

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

@Injectable({
  providedIn: 'root'
})
export class MedicineService {

  private readonly baseUrl = 'https://makpharma-billing-final.onrender.com/api/medicines';

  private medicinesSubject = new BehaviorSubject<Medicine[]>([]);
  medicines$ = this.medicinesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadMedicines();
  }

  /* =========================================
     LOAD FROM BACKEND (FIXED)
  ========================================= */

  loadMedicines(): void {

    this.http.get<{ success: boolean; data: any[] }>(this.baseUrl).pipe(

      tap((res) => {

        console.log("🔥 API RESPONSE:", res); // debug

        const data = res?.data || [];

        const formatted: Medicine[] = data.map((m: any) => ({
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

        this.medicinesSubject.next(formatted);
      }),

      catchError((err) => {
        console.error('❌ Load Medicines Error:', err);
        return throwError(() => err);
      })

    ).subscribe();
  }

  /* =========================================
     GET CURRENT VALUE
  ========================================= */

  getMedicines(): Medicine[] {
    return this.medicinesSubject.value || [];
  }

  /* =========================================
     ADD MEDICINE
  ========================================= */

  addMedicine(med: Medicine): Observable<any> {

    return this.http.post(`${this.baseUrl}/add`, med).pipe(

      tap(() => this.loadMedicines()),

      catchError((err) => {
        console.error('❌ Add Medicine Error:', err);
        return throwError(() => err);
      })

    );
  }

  /* =========================================
     UPDATE MEDICINE
  ========================================= */

  updateMedicine(id: string, med: Medicine): Observable<any> {

    if (!id) {
      return throwError(() => new Error('Invalid Medicine ID'));
    }

    return this.http.put(`${this.baseUrl}/${id}`, med).pipe(

      tap(() => this.loadMedicines()),

      catchError((err) => {
        console.error('❌ Update Medicine Error:', err);
        return throwError(() => err);
      })

    );
  }

  /* =========================================
     DELETE MEDICINE
  ========================================= */

  deleteMedicine(id: string): Observable<any> {

    if (!id) {
      return throwError(() => new Error('Invalid Medicine ID'));
    }

    return this.http.delete(`${this.baseUrl}/${id}`).pipe(

      tap(() => this.loadMedicines()),

      catchError((err) => {
        console.error('❌ Delete Medicine Error:', err);
        return throwError(() => err);
      })

    );
  }

  /* =========================================
     REDUCE STOCK (LOCAL UPDATE)
  ========================================= */

  reduceStock(name: string, qty: number): void {

    const medicines = this.medicinesSubject.value;

    const updated = medicines.map(med => {

      if (med.name === name) {
        return {
          ...med,
          stock: Math.max((med.stock || 0) - qty, 0)
        };
      }

      return med;
    });

    this.medicinesSubject.next(updated);
  }

}