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
     🔐 TOKEN MANAGEMENT (CENTRALIZED)
  ====================================================== */

  private TOKEN_KEY = 'token';
  private USER_KEY = 'user';
  private EXPIRY_KEY = 'tokenExpiry';

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);

    // 1 hour expiry
    const expiry = Date.now() + (60 * 60 * 1000);
    localStorage.setItem(this.EXPIRY_KEY, expiry.toString());
  }

  private clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.EXPIRY_KEY);
  }

  isTokenValid(): boolean {
    const token = this.getToken();
    const expiry = localStorage.getItem(this.EXPIRY_KEY);

    if (!token || !expiry) return false;

    return Date.now() < Number(expiry);
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

      this.setToken(res.token);

      const user = {
        ...res.user,
        actionPassword: res.user.actionPassword || ''
      };

      localStorage.setItem(this.USER_KEY, JSON.stringify(user));

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
    this.clearToken();
    localStorage.removeItem(this.USER_KEY);
  }

  /* ======================================================
     👤 USER
  ====================================================== */

  getUser(): any {
    try {
      return JSON.parse(localStorage.getItem(this.USER_KEY) || 'null');
    } catch {
      return null;
    }
  }

  updateUser(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /* ======================================================
     🔒 ACTION PASSWORD (LOCAL SECURITY)
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
     🌐 PROFILE API
  ====================================================== */

  private getHeaders() {
    const token = this.getToken();

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token || ''}`
      })
    };
  }

  getProfile() {
    return this.http.get(`${this.baseUrl}/profile`, this.getHeaders());
  }

  updateProfile(data: any) {
    return this.http.put(`${this.baseUrl}/profile`, data, this.getHeaders());
  }

  /* ======================================================
     🔁 OTP FLOW
  ====================================================== */

  async sendOtp(email: string): Promise<any> {
    return await firstValueFrom(
      this.http.post(`${this.baseUrl}/send-otp`, { email })
    );
  }

  async verifyOtp(email: string, otp: string): Promise<any> {
    return await firstValueFrom(
      this.http.post(`${this.baseUrl}/verify-otp`, { email, otp })
    );
  }

  async resetPassword(email: string, password: string): Promise<any> {
    return await firstValueFrom(
      this.http.post(`${this.baseUrl}/reset-password`, { email, password })
    );
  }

  /* ======================================================
     ✅ SESSION CHECK (IMPROVED)
  ====================================================== */

  isLoggedIn(): boolean {
    const user = this.getUser();

    if (!this.isTokenValid() || !user) {
      this.logout();
      return false;
    }

    return true;
  }

}