import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  private baseUrl = 'http://localhost:5000/api/customers';

  private customersSubject = new BehaviorSubject<any[]>([]);
  customers$ = this.customersSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCustomers();
  }

  /* ================= LOAD ================= */

  loadCustomers() {
    this.http.get<any[]>(this.baseUrl).subscribe(data => {
      this.customersSubject.next(data);
    });
  }

  /* ================= GET ================= */

  getCustomers() {
    return this.customersSubject.value;
  }

  /* ================= ADD ================= */

  addCustomer(customer: any) {
    this.http.post(this.baseUrl + '/add', customer).subscribe(() => {
      this.loadCustomers();
    });
  }

  /* ================= UPDATE ================= */

  updateCustomer(index: number, customer: any) {
    const data = this.getCustomers();
    const id = data[index]?._id;

    if (!id) return;

    this.http.put(`${this.baseUrl}/${id}`, customer).subscribe(() => {
      this.loadCustomers();
    });
  }

  /* ================= DELETE ================= */

  deleteCustomer(index: number) {
    const data = this.getCustomers();
    const id = data[index]?._id;

    if (!id) return;

    this.http.delete(`${this.baseUrl}/${id}`).subscribe(() => {
      this.loadCustomers();
    });
  }

}