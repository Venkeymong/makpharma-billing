import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  private baseUrl = 'https://makpharma-billing-final.onrender.com/api/reports';

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

  /* ================= GET REPORT ================= */

  getReport(type: string, startDate?: string, endDate?: string) {

    let url = `${this.baseUrl}?type=${type}`;

    if (type === 'custom' && startDate && endDate) {
      url += `&startDate=${startDate}&endDate=${endDate}`;
    }

    return this.http.get<any>(url, this.getHeaders());
  }

}