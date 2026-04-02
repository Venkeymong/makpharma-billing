import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  private baseUrl = 'https://makpharma-billing-final.onrender.com/api/customers';

  private customersSubject = new BehaviorSubject<any[]>([]);
  customers$ = this.customersSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCustomers();
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

  /* ================= LOAD ================= */

  loadCustomers() {
    this.http.get<any[]>(this.baseUrl, this.getHeaders()).subscribe({
      next: (data) => {
        this.customersSubject.next(data);
      },
      error: (err) => {
        console.error('Load Customers Error:', err);
      }
    });
  }

  /* ================= GET ================= */

  getCustomers() {
    return this.customersSubject.value;
  }

  /* ================= ADD ================= */

  addCustomer(customer: any) {
    this.http.post(this.baseUrl + '/add', customer, this.getHeaders()).subscribe({
      next: () => {
        this.loadCustomers();
      },
      error: (err) => {
        console.error('Add Customer Error:', err);
      }
    });
  }

  /* ================= UPDATE ================= */

  updateCustomer(index: number, customer: any) {
    const data = this.getCustomers();
    const id = data[index]?._id;

    if (!id) return;

    this.http.put(`${this.baseUrl}/${id}`, customer, this.getHeaders()).subscribe({
      next: () => {
        this.loadCustomers();
      },
      error: (err) => {
        console.error('Update Error:', err);
      }
    });
  }

  /* ================= DELETE ================= */

  deleteCustomer(index: number) {
    const data = this.getCustomers();
    const id = data[index]?._id;

    if (!id) return;

    this.http.delete(`${this.baseUrl}/${id}`, this.getHeaders()).subscribe({
      next: () => {
        this.loadCustomers();
      },
      error: (err) => {
        console.error('Delete Error:', err);
      }
    });
  }

}