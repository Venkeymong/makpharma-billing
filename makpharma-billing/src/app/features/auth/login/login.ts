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

  username = '';
  password = '';
  showPassword = false;

  loginError = '';
  loading = false;

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

  timer = 60;
  interval: any;
  canResend = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (token) this.router.navigate(['/dashboard']);
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  // LOGIN
  async login() {
    if (this.loading) return;

    this.loginError = '';

    if (!this.username.trim() || !this.password.trim()) {
      this.loginError = 'All fields are required';
      return;
    }

    this.loading = true;

    try {
      const success = await this.auth.login(
        this.username.trim(),
        this.password.trim()
      );

      if (success) {
        this.router.navigate(['/dashboard']);
      } else {
        this.loginError = 'Invalid credentials';
      }
    } catch {
      this.loginError = 'Server error';
    } finally {
      this.loading = false;
    }
  }

  // MODAL
  openForgot() {
    this.showForgot = true;
    this.resetState();
  }

  closeForgot() {
    this.showForgot = false;
    this.resetState();
  }

  resetState() {
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

  // TIMER
  startTimer() {
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

  // SEND OTP
  async sendOtp() {

    if (this.otpLoading) return;

    this.otpError = '';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(this.email)) {
      this.otpError = 'Enter valid email';
      return;
    }

    this.otpLoading = true;

    try {
      await this.auth.sendOtp(this.email.trim());
      this.step = 2;
      this.startTimer();
    } catch (err: any) {
      this.otpError = err?.error?.message || 'Failed to send OTP';
    } finally {
      this.otpLoading = false;
    }
  }

  // VERIFY OTP
  async verifyOtp() {

    if (this.verifyLoading) return;

    this.verifyError = '';

    if (!/^\d{6}$/.test(this.otp)) {
      this.verifyError = 'Enter 6-digit OTP';
      return;
    }

    this.verifyLoading = true;

    try {
      await this.auth.verifyOtp(this.email.trim(), this.otp.trim());
      this.step = 3;
    } catch (err: any) {
      this.verifyError = err?.error?.message || 'Invalid OTP';
    } finally {
      this.verifyLoading = false;
    }
  }

  // RESET PASSWORD
  async resetPassword() {

    if (this.resetLoading) return;

    this.resetError = '';

    if (this.newPassword.length < 6) {
      this.resetError = 'Password too short';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.resetError = 'Passwords do not match';
      return;
    }

    this.resetLoading = true;

    try {
      await this.auth.resetPassword(this.email, this.newPassword);
      alert('Password reset successful');
      this.closeForgot();
    } catch (err: any) {
      this.resetError = err?.error?.message || 'Reset failed';
    } finally {
      this.resetLoading = false;
    }
  }

  // RESEND
  resendOtp() {
    if (!this.canResend) return;
    this.sendOtp();
  }
}