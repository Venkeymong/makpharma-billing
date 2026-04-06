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
     🔐 HEADERS
  ====================================================== */

  private getHeaders() {
    const token = localStorage.getItem('token');

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token || ''}`
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

      if (!res?.token || !res?.user) return false;

      localStorage.setItem('token', res.token);

      const user = {
        ...res.user,
        actionPassword: res.user.actionPassword || ''
      };

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('loginTime', Date.now().toString());

      return true;

    } catch (err) {
      console.error('❌ Login Error:', err);
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
     👤 USER CACHE
  ====================================================== */

  getUser(): any {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  }

  updateUser(user: any): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  /* ======================================================
     🔒 ACTION PASSWORD
  ====================================================== */

  getActionPassword(): string {
    return this.getUser()?.actionPassword || '';
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
     🌐 PROFILE
  ====================================================== */

  getProfile() {
    return this.http.get(`${this.baseUrl}/profile`, this.getHeaders());
  }

  updateProfile(data: any) {
    return this.http.put(`${this.baseUrl}/profile`, data, this.getHeaders());
  }

  /* ======================================================
     🔁 OTP FLOW (FIXED)
  ====================================================== */

  async sendOtp(email: string): Promise<any> {
    try {
      const res = await firstValueFrom(
        this.http.post(`${this.baseUrl}/send-otp`, { email })
      );
      return res;
    } catch (err) {
      console.error("❌ SEND OTP ERROR:", err);
      throw err;
    }
  }

  async verifyOtp(email: string, otp: string): Promise<any> {
    try {
      const res = await firstValueFrom(
        this.http.post(`${this.baseUrl}/verify-otp`, { email, otp })
      );
      return res;
    } catch (err) {
      console.error("❌ VERIFY OTP ERROR:", err);
      throw err;
    }
  }

  async resetPassword(email: string, password: string): Promise<any> {
    try {
      const res = await firstValueFrom(
        this.http.post(`${this.baseUrl}/reset-password`, { email, password })
      );
      return res;
    } catch (err) {
      console.error("❌ RESET ERROR:", err);
      throw err;
    }
  }

  /* ======================================================
     ✅ SESSION
  ====================================================== */

  isLoggedIn(): boolean {

    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) return false;

    const loginTime = localStorage.getItem('loginTime');

    if (loginTime) {

      const diff = Date.now() - Number(loginTime);
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
     🎟️ TOKEN
  ====================================================== */

  getToken(): string | null {
    return localStorage.getItem('token');
  }

}