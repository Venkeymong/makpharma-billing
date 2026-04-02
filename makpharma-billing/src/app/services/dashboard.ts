import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private baseUrl = 'https://makpharma-billing-final.onrender.com/api/dashboard';

  constructor(private http: HttpClient) {}

  /* ================= HELPER (TOKEN) ================= */

  private getHeaders() {
    const token = localStorage.getItem('token');

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  /* ================= GET DASHBOARD ================= */

  getDashboard() {
    return this.http.get<any>(this.baseUrl, this.getHeaders());
  }
}