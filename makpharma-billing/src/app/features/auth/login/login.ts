import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit, OnDestroy {

  // =============================
  // 🔐 LOGIN
  // =============================
  username = '';
  password = '';
  showPassword = false;

  loginError = '';
  loading = false;

  // =============================
  // 🔁 FORGOT PASSWORD
  // =============================
  showForgot = false;
  step = 1;

  email = '';
  otp = '';
  newPassword = '';
  confirmPassword = '';

  otpError = '';
  verifyError = '';
  resetError = '';

  otpLoading = false;
  verifyLoading = false;
  resetLoading = false;

  // =============================
  // ⏱ TIMER
  // =============================
  timer = 60;
  interval: ReturnType<typeof setInterval> | null = null;
  canResend = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  // =============================
  // 🚀 INIT
  // =============================
  ngOnInit(): void {
    const token = localStorage.getItem('token');

    // 🔥 Wake up backend (Render cold start fix)
    fetch('https://makpharma-billing-final.onrender.com');

    if (token) {
      this.router.navigate(['/dashboard']);
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  // =============================
  // 🔑 LOGIN
  // =============================
  async login() {

    if (this.loading) return;

    this.loginError = '';

    const username = this.username.trim();
    const password = this.password.trim();

    if (!username || !password) {
      this.loginError = 'All fields are required';
      return;
    }

    this.loading = true;

    try {

      const loginPromise = this.auth.login(username, password);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 8000)
      );

      const success: any = await Promise.race([loginPromise, timeoutPromise]);

      if (success) {
        this.router.navigate(['/dashboard']);
      } else {
        this.loginError = 'Invalid username or password';
      }

    } catch (err: any) {

      if (err.message === 'timeout') {
        this.loginError = 'Server is slow. Please try again.';
      } else {
        this.loginError = err?.error?.message || 'Login failed';
      }

    } finally {
      this.loading = false;
    }
  }

  // =============================
  // 🔐 MODAL CONTROL
  // =============================
  openForgot() {
    this.showForgot = true;
    this.resetState();
  }

  closeForgot() {
    this.showForgot = false;
    this.resetState();
  }

  private resetState() {
    this.step = 1;

    this.email = '';
    this.otp = '';
    this.newPassword = '';
    this.confirmPassword = '';

    this.otpError = '';
    this.verifyError = '';
    this.resetError = '';

    this.stopTimer();
  }

  // =============================
  // ⏱ TIMER CONTROL
  // =============================
  startTimer() {

    this.stopTimer(); // 🔥 prevent multiple timers

    this.timer = 60;
    this.canResend = false;

    this.interval = setInterval(() => {
      this.timer--;

      if (this.timer <= 0) {
        this.stopTimer();
        this.canResend = true;
      }
    }, 1000);
  }

  stopTimer() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  // =============================
  // 📧 SEND OTP
  // =============================
  async sendOtp() {

    if (this.otpLoading) return;

    this.otpError = '';

    const email = this.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      this.otpError = 'Enter a valid email';
      return;
    }

    this.otpLoading = true;

    try {
      await this.auth.sendOtp(email);
      this.step = 2;
      this.startTimer();
    } catch (err: any) {
      this.otpError = err?.error?.message || 'Failed to send OTP';
    } finally {
      this.otpLoading = false;
    }
  }

  // =============================
  // 🔢 VERIFY OTP
  // =============================
  async verifyOtp() {

    if (this.verifyLoading) return;

    this.verifyError = '';

    const otp = this.otp.trim();

    if (!/^\d{6}$/.test(otp)) {
      this.verifyError = 'Enter valid 6-digit OTP';
      return;
    }

    this.verifyLoading = true;

    try {
      await this.auth.verifyOtp(this.email.trim(), otp);
      this.step = 3;
    } catch (err: any) {
      this.verifyError = err?.error?.message || 'Invalid OTP';
    } finally {
      this.verifyLoading = false;
    }
  }

  // =============================
  // 🔄 RESET PASSWORD
  // =============================
  async resetPassword() {

    if (this.resetLoading) return;

    this.resetError = '';

    if (this.newPassword.length < 6) {
      this.resetError = 'Password must be at least 6 characters';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.resetError = 'Passwords do not match';
      return;
    }

    this.resetLoading = true;

    try {
      await this.auth.resetPassword(
        this.email.trim(),
        this.newPassword
      );

      alert('Password reset successful');
      this.closeForgot();

    } catch (err: any) {
      this.resetError = err?.error?.message || 'Reset failed';
    } finally {
      this.resetLoading = false;
    }
  }

  // =============================
  // 🔁 RESEND OTP
  // =============================
  resendOtp() {
    if (!this.canResend) return;
    this.sendOtp();
  }

}