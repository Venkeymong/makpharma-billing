import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = 'http://localhost:5000/api/auth';

  constructor(private http: HttpClient) {}

  /* ================= LOGIN ================= */

  login(username: string, password: string): Promise<boolean> {

    return new Promise((resolve) => {

      this.http.post<any>(`${this.baseUrl}/login`, {
        username,
        password
      }).subscribe({

        next: (res) => {

          // ✅ Store token
          localStorage.setItem('token', res.token);

          // ✅ Store user (for UI usage)
          localStorage.setItem('user', JSON.stringify(res.user));

          resolve(true);
        },

        error: (err) => {
          console.error('Login Error:', err);
          resolve(false);
        }

      });

    });
  }

  /* ================= LOGOUT ================= */

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  /* ================= GET USER ================= */

  getUser(): any {

    const user = localStorage.getItem('user');

    try {
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  /* ================= CHECK LOGIN ================= */

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

}