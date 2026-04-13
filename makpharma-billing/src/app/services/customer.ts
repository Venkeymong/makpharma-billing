import { Injectable } from '@angular/core';
import { BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  private baseUrl = 'https://makpharma-billing-final.onrender.com/api/customers';

  /* =========================================
     STATE MANAGEMENT
  ========================================= */

  private customersSubject = new BehaviorSubject<any[]>([]);
  customers$ = this.customersSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCustomers();
  }

  /* =========================================
     LOAD CUSTOMERS
  ========================================= */

  loadCustomers() {
    this.http.get<any[]>(this.baseUrl).pipe(

      tap((data) => {
        this.customersSubject.next(data || []);
      }),

      catchError((err) => {
        console.error('❌ Load Customers Error:', err);
        return throwError(() => err);
      })

    ).subscribe();
  }

  /* =========================================
     GET CURRENT VALUE
  ========================================= */

  getCustomers(): any[] {
    return this.customersSubject.value || [];
  }

  /* =========================================
     ADD CUSTOMER
  ========================================= */

  addCustomer(customer: any) {
    return this.http.post<any>(`${this.baseUrl}/add`, customer).pipe(

      tap((newCustomer) => {
        const current = this.getCustomers();
        this.customersSubject.next([...current, newCustomer]);
      }),

      catchError((err) => {
        console.error('❌ Add Customer Error:', err);
        return throwError(() => err);
      })

    );
  }

  /* =========================================
     UPDATE CUSTOMER (ID BASED ✅)
  ========================================= */

  updateCustomer(id: string, customer: any) {
    return this.http.put<any>(`${this.baseUrl}/${id}`, customer).pipe(

      tap((updatedCustomer) => {

        const updated = this.getCustomers().map(c =>
          c._id === id ? { ...c, ...updatedCustomer } : c
        );

        this.customersSubject.next(updated);
      }),

      catchError((err) => {
        console.error('❌ Update Customer Error:', err);
        return throwError(() => err);
      })

    );
  }

  /* =========================================
     DELETE CUSTOMER (ID BASED ✅)
  ========================================= */

  deleteCustomer(id: string) {
    return this.http.delete(`${this.baseUrl}/${id}`).pipe(

      tap(() => {

        const updated = this.getCustomers().filter(c => c._id !== id);

        this.customersSubject.next(updated);
      }),

      catchError((err) => {
        console.error('❌ Delete Customer Error:', err);
        return throwError(() => err);
      })

    );
  }

}