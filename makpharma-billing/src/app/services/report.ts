import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  private baseUrl = 'http://localhost:5000/api/reports';

  constructor(private http: HttpClient) {}

  getReport(type: string, startDate?: string, endDate?: string) {

    let url = `${this.baseUrl}?type=${type}`;

    if (type === 'custom' && startDate && endDate) {
      url += `&startDate=${startDate}&endDate=${endDate}`;
    }

    return this.http.get<any>(url);
  }

}