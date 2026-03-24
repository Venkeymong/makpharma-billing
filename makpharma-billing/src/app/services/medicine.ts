import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class MedicineService {

  private baseUrl = 'http://localhost:5000/api/medicines';

  private medicinesSubject = new BehaviorSubject<any[]>([]);
  medicines$ = this.medicinesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadMedicines();
  }

  /* ================= LOAD FROM BACKEND ================= */

  loadMedicines() {
    this.http.get<any[]>(this.baseUrl).subscribe({
      next: (data) => {
        this.medicinesSubject.next(data);
      },
      error: (err) => console.error(err)
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
    this.http.post(this.baseUrl + '/add', med).subscribe(() => {
      this.loadMedicines(); // refresh
    });
  }

  /* ================= UPDATE ================= */

  updateMedicine(index: number, med: any) {
    const data = this.getMedicines();
    const id = data[index]?._id;

    if (!id) return;

    this.http.put(`${this.baseUrl}/${id}`, med).subscribe(() => {
      this.loadMedicines();
    });
  }

  /* ================= DELETE ================= */

  deleteMedicine(index: number) {
    const data = this.getMedicines();
    const id = data[index]?._id;

    if (!id) return;

    this.http.delete(`${this.baseUrl}/${id}`).subscribe(() => {
      this.loadMedicines();
    });
  }

  /* ================= STOCK ================= */

 reduceStock(name: string, qty: number) {

  const medicines = this.medicinesSubject.value;

  const updated = medicines.map(med => {
    if (med.name === name) {

      return {
        ...med,
        stock: med.stock - qty   // ✅ ONLY reduce sold qty
      };

    }
    return med;
  });

  this.medicinesSubject.next(updated);
}

}