import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class MedicineService {

  private baseUrl = 'https://makpharma-billing-final.onrender.com/api/medicines';

  private medicinesSubject = new BehaviorSubject<any[]>([]);
  medicines$ = this.medicinesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadMedicines();
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

  /* ================= LOAD FROM BACKEND ================= */

  loadMedicines() {
    this.http.get<any[]>(this.baseUrl, this.getHeaders()).subscribe({
      next: (data) => {
        this.medicinesSubject.next(data);
      },
      error: (err) => console.error('Load Medicines Error:', err)
    });
  }

  /* ================= GET CURRENT VALUE ================= */

  getMedicines(): any[] {
    return this.medicinesSubject.value;
  }

  /* ================= SET STATE ================= */

  private setMedicines(data: any[]) {
    this.medicinesSubject.next([...data]);
  }

  /* ================= ADD ================= */

  addMedicine(med: any) {
    this.http.post(this.baseUrl + '/add', med, this.getHeaders()).subscribe({
      next: () => {
        this.loadMedicines();
      },
      error: (err) => console.error('Add Medicine Error:', err)
    });
  }

  /* ================= UPDATE ================= */

  updateMedicine(index: number, med: any) {
    const data = this.getMedicines();
    const id = data[index]?._id;

    if (!id) return;

    this.http.put(`${this.baseUrl}/${id}`, med, this.getHeaders()).subscribe({
      next: () => {
        this.loadMedicines();
      },
      error: (err) => console.error('Update Medicine Error:', err)
    });
  }

  /* ================= DELETE ================= */

  deleteMedicine(index: number) {
    const data = this.getMedicines();
    const id = data[index]?._id;

    if (!id) return;

    this.http.delete(`${this.baseUrl}/${id}`, this.getHeaders()).subscribe({
      next: () => {
        this.loadMedicines();
      },
      error: (err) => console.error('Delete Medicine Error:', err)
    });
  }

  /* ================= STOCK ================= */

  reduceStock(name: string, qty: number) {

    const medicines = this.medicinesSubject.value;

    const updated = medicines.map(med => {
      if (med.name === name) {
        return {
          ...med,
          stock: med.stock - qty
        };
      }
      return med;
    });

    this.medicinesSubject.next(updated);
  }

}