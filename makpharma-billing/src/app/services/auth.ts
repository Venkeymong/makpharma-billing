import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // =============================
  // 🌐 API
  // =============================
  private baseUrl = 'https://makpharma-billing-final.onrender.com/api/auth';

  constructor(private http: HttpClient) {}

  // =============================
  // 🔐 TOKEN MANAGEMENT
  // =============================
  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY = 'user';
  private readonly EXPIRY_KEY = 'tokenExpiry';

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);

    // ⏱ 1 hour expiry
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

  // =============================
  // 🔑 LOGIN
  // =============================
 async login(username: string, password: string): Promise<boolean> {

  try {

    const res = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username.trim(),
        password: password.trim()
      })
    });

    const data = await res.json();

    console.log("🔥 LOGIN RESPONSE:", data);

    if (!data?.token || !data?.user) return false;

    // ✅ Store token
    this.setToken(data.token);

    // ✅ Store user
    const user = {
      ...data.user,
      actionPassword: data.user?.actionPassword || ''
    };

    localStorage.setItem(this.USER_KEY, JSON.stringify(user));

    return true;

  } catch (err: any) {
    console.error("❌ LOGIN ERROR:", err);
    return false;
  }
}
  // =============================
  // 🚪 LOGOUT
  // =============================
  logout(): void {
    this.clearToken();
    localStorage.removeItem(this.USER_KEY);
  }

  // =============================
  // 👤 USER
  // =============================
  getUser(): any {
    try {
      const data = localStorage.getItem(this.USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  updateUser(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  // =============================
  // 🔒 ACTION PASSWORD
  // =============================
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
      alert('Set action password in profile first!');
      return false;
    }

    return input === actual;
  }

  // =============================
  // 🌐 HEADERS
  // =============================
  private getHeaders() {
    const token = this.getToken();

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token || ''}`,
        'Content-Type': 'application/json'
      })
    };
  }

  // =============================
  // 👤 PROFILE API
  // =============================
  getProfile() {
    return this.http.get(`${this.baseUrl}/profile`, this.getHeaders());
  }

  updateProfile(data: any) {
    return this.http.put(`${this.baseUrl}/profile`, data, this.getHeaders());
  }

  // =============================
  // 🔁 OTP FLOW
  // =============================
  async sendOtp(email: string): Promise<any> {
    return await firstValueFrom(
      this.http.post(`${this.baseUrl}/send-otp`, { email: email.trim() }, {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        })
      })
    );
  }

  async verifyOtp(email: string, otp: string): Promise<any> {
    return await firstValueFrom(
      this.http.post(`${this.baseUrl}/verify-otp`, {
        email: email.trim(),
        otp: otp.trim()
      }, {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        })
      })
    );
  }

  async resetPassword(email: string, password: string): Promise<any> {
    return await firstValueFrom(
      this.http.post(`${this.baseUrl}/reset-password`, {
        email: email.trim(),
        password: password.trim()
      }, {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        })
      })
    );
  }

  // =============================
  // ✅ SESSION CHECK
  // =============================
  isLoggedIn(): boolean {
    const user = this.getUser();

    if (!this.isTokenValid() || !user) {
      this.logout();
      return false;
    }

    return true;
  }

}