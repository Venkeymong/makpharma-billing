import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';

export interface DashboardData {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  totalMedicines: number;
  lowStock: any[];
  recentSales: any[];
  expirySoon: any[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private readonly baseUrl = 'https://makpharma-billing-final.onrender.com/api/dashboard';

  constructor(private http: HttpClient) {}

  /* =========================================
     GET DASHBOARD DATA
  ========================================= */

  getDashboard(): Observable<DashboardData> {

    return this.http.get<any>(this.baseUrl).pipe(

      map((res) => ({
        totalSales: res?.totalSales || 0,
        totalOrders: res?.totalOrders || 0,
        totalCustomers: res?.totalCustomers || 0,
        totalMedicines: res?.totalMedicines || 0,
        lowStock: res?.lowStock || [],
        recentSales: res?.recentSales || [],
        expirySoon: res?.expirySoon || []
      })),

      catchError((error) => {
        console.error('Dashboard API Error:', error);
        return throwError(() => error);
      })

    );
  }

}