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

  /* ======================================================
     🔐 LOGIN
  ====================================================== */

  username: string = '';
  password: string = '';
  error: string = '';
  loading: boolean = false;

  /* ======================================================
     🔁 FORGOT PASSWORD
  ====================================================== */

  showForgot: boolean = false;
  step: number = 1;

  email: string = '';
  otp: string = '';
  newPassword: string = '';

  otpLoading: boolean = false;
  verifyLoading: boolean = false;
  resetLoading: boolean = false;

  /* ======================================================
     ⏳ OTP TIMER
  ====================================================== */

  timer: number = 60;
  interval: any;
  canResend: boolean = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  /* ======================================================
     🚀 INIT
  ====================================================== */

  ngOnInit(): void {
    const token = localStorage.getItem('token');

    if (token) {
      this.router.navigate(['/dashboard']);
    }
  }

  /* ======================================================
     🧹 CLEANUP (IMPORTANT)
  ====================================================== */

  ngOnDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  /* ======================================================
     🔑 LOGIN
  ====================================================== */

  async login(): Promise<void> {

    if (this.loading) return;

    this.error = '';
    this.loading = true;

    try {

      const success = await this.auth.login(
        this.username.trim(),
        this.password.trim()
      );

      if (success) {
        this.router.navigate(['/dashboard']);
      } else {
        this.error = 'Invalid username or password';
      }

    } catch (err) {
      console.error('Login Error:', err);
      this.error = 'Server error. Try again.';
    } finally {
      this.loading = false;
    }
  }

  /* ======================================================
     🪟 FORGOT MODAL
  ====================================================== */

  openForgot(): void {
    this.showForgot = true;
    this.resetState();
  }

  closeForgot(): void {
    this.showForgot = false;
    this.resetState();
  }

  /* ======================================================
     🔄 RESET STATE
  ====================================================== */

  resetState(): void {
    this.step = 1;
    this.email = '';
    this.otp = '';
    this.newPassword = '';

    this.otpLoading = false;
    this.verifyLoading = false;
    this.resetLoading = false;

    this.stopTimer();
  }

  /* ======================================================
     ⏳ TIMER LOGIC
  ====================================================== */

  startTimer(): void {

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

  stopTimer(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  /* ======================================================
     📩 SEND OTP
  ====================================================== */

  sendOtp(): void {

    if (!this.email || !this.email.includes('@')) {
      this.error = 'Enter valid email';
      return;
    }

    this.error = '';
    this.otpLoading = true;

    this.auth.sendOtp(this.email.trim()).subscribe({
      next: () => {
        this.step = 2;
        this.startTimer();
        this.otpLoading = false;
      },
      error: () => {
        this.error = 'Failed to send OTP';
        this.otpLoading = false;
      }
    });
  }

  /* ======================================================
     🔑 VERIFY OTP
  ====================================================== */

  verifyOtp(): void {

    if (!this.otp || this.otp.length < 4) {
      this.error = 'Enter valid OTP';
      return;
    }

    this.error = '';
    this.verifyLoading = true;

    this.auth.verifyOtp(this.email, this.otp).subscribe({
      next: () => {
        this.step = 3;
        this.verifyLoading = false;
      },
      error: () => {
        this.error = 'Invalid or expired OTP';
        this.verifyLoading = false;
      }
    });
  }

  /* ======================================================
     🔒 RESET PASSWORD
  ====================================================== */

  resetPassword(): void {

    if (!this.newPassword || this.newPassword.length < 4) {
      this.error = 'Password must be at least 4 characters';
      return;
    }

    this.error = '';
    this.resetLoading = true;

    this.auth.resetPassword(this.email, this.newPassword).subscribe({
      next: () => {
        this.closeForgot();
        this.error = '';
        alert("Password reset successful!");
        this.resetLoading = false;
      },
      error: () => {
        this.error = 'Failed to reset password';
        this.resetLoading = false;
      }
    });
  }

  /* ======================================================
     🔁 RESEND OTP
  ====================================================== */

  resendOtp(): void {

    if (!this.canResend) return;

    this.sendOtp();
  }

}