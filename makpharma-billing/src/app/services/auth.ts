import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = 'https://makpharma-billing-final.onrender.com/api/auth';

  constructor(private http: HttpClient) {}

  /* ======================================================
     🔐 HEADERS (TOKEN)
  ====================================================== */

  private getHeaders() {
    const token = localStorage.getItem('token');

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  /* ======================================================
     🔑 LOGIN
  ====================================================== */

  async login(username: string, password: string): Promise<boolean> {

    try {

      const res: any = await firstValueFrom(
        this.http.post(`${this.baseUrl}/login`, {
          username: username.trim(),
          password: password.trim()
        })
      );

      if (!res || !res.token || !res.user) {
        return false;
      }

      /* ===== STORE TOKEN ===== */
      localStorage.setItem('token', res.token);

      /* ===== STORE USER ===== */
      const user = {
        ...res.user,
        actionPassword: res.user.actionPassword || ''
      };

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('loginTime', Date.now().toString());

      return true;

    } catch (err) {
      console.error('Login Error:', err);
      return false;
    }
  }

  /* ======================================================
     🚪 LOGOUT
  ====================================================== */

  logout(): void {
    localStorage.clear();
  }

  /* ======================================================
     👤 USER MANAGEMENT (LOCAL CACHE)
  ====================================================== */

  getUser(): any {
    const user = localStorage.getItem('user');

    try {
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  updateUser(user: any): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  /* ======================================================
     🔒 ACTION PASSWORD (LOCAL SECURITY)
  ====================================================== */

  getActionPassword(): string {
    const user = this.getUser();
    return user?.actionPassword || '';
  }

  setActionPassword(password: string): void {
    const user = this.getUser();
    if (!user) return;

    user.actionPassword = password;
    this.updateUser(user);
  }

  verifyActionPassword(input: string): boolean {
    const actual = this.getActionPassword();

    if (!actual) {
      alert("Set action password in profile first!");
      return false;
    }

    return input === actual;
  }

  /* ======================================================
     🌐 PROFILE (BACKEND)
  ====================================================== */

  getProfile() {
    return this.http.get(`${this.baseUrl}/profile`, this.getHeaders());
  }

  updateProfile(data: any) {
    return this.http.put(`${this.baseUrl}/profile`, data, this.getHeaders());
  }

  /* ======================================================
     🔁 OTP PASSWORD RESET FLOW
  ====================================================== */

  // 🔹 SEND OTP
  sendOtp(email: string) {
    return this.http.post(`${this.baseUrl}/send-otp`, { email });
  }

  // 🔹 VERIFY OTP
  verifyOtp(email: string, otp: string) {
    return this.http.post(`${this.baseUrl}/verify-otp`, { email, otp });
  }

  // 🔹 RESET PASSWORD
  resetPassword(email: string, password: string) {
    return this.http.post(`${this.baseUrl}/reset-password`, { email, password });
  }

  /* ======================================================
     ✅ SESSION CHECK
  ====================================================== */

  isLoggedIn(): boolean {

    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) return false;

    /* ===== SESSION EXPIRY ===== */

    const loginTime = localStorage.getItem('loginTime');

    if (loginTime) {

      const now = Date.now();
      const diff = now - Number(loginTime);

      const THIRTY_MIN = 30 * 60 * 1000;

      if (diff > THIRTY_MIN) {
        console.warn('Session expired');
        this.logout();
        return false;
      }
    }

    return true;
  }

  /* ======================================================
     🎟️ TOKEN ACCESS
  ====================================================== */

  getToken(): string | null {
    return localStorage.getItem('token');
  }

}