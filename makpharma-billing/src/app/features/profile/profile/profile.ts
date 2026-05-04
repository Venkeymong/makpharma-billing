import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class Profile implements OnInit {

  profile: any = {};
  originalProfile: any = {};

  isEditMode: boolean = false;

  adminPassword: string = '';
  systemPassword: string = '';
  confirmPassword: string = '';

  isVerified: boolean = false;

  passwordStrength: string = '';
  strengthClass: string = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    const user = this.auth.getUser();

    if (!user) {
      this.logout();
      return;
    }

    this.profile = { ...user };
  }

  enableEdit(): void {
    this.isEditMode = true;
    this.originalProfile = { ...this.profile };
  }

  cancelEdit(): void {
    this.profile = { ...this.originalProfile };
    this.isEditMode = false;
  }

  saveProfile(): void {

    if (!this.profile) return;

    this.auth.updateUser(this.profile);

    this.isEditMode = false;

    alert("Profile updated successfully!");
  }

  verifyAdmin(): void {

    if (!this.adminPassword) {
      alert("Enter admin password!");
      return;
    }

    if (this.adminPassword !== "Arun1552") {
      alert("Invalid Admin Password!");
      return;
    }

    this.isVerified = true;

    alert("Admin verified successfully!");
  }

  checkStrength(): void {

    const pwd = this.systemPassword || '';

    if (pwd.length < 4) {
      this.passwordStrength = "Weak";
      this.strengthClass = "weak";
    }
    else if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && pwd.length >= 6) {
      this.passwordStrength = "Strong";
      this.strengthClass = "strong";
    }
    else {
      this.passwordStrength = "Medium";
      this.strengthClass = "medium";
    }
  }

  saveSystemPassword(): void {

    if (!this.systemPassword || !this.confirmPassword) {
      alert("Fill all fields!");
      return;
    }

    if (this.systemPassword !== this.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (this.systemPassword.length < 4) {
      alert("Password too weak!");
      return;
    }

    this.auth.setActionPassword(this.systemPassword);

    alert("System password updated successfully!");

    this.systemPassword = '';
    this.confirmPassword = '';
    this.passwordStrength = '';
  }

  onPhotoChange(event: any): void {

    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      this.profile.photo = reader.result;
      this.auth.updateUser(this.profile);
    };

    reader.readAsDataURL(file);
  }

  goBack(): void {

    const el = document.querySelector('.profile-container');

    if (el) {
      el.classList.add('slide-out');
    }

    setTimeout(() => {
      this.router.navigate(['/dashboard']);
    }, 200);
  }

  logout(): void {

    this.auth.logout();

    // 🔥 FIXED (important)
    window.location.replace('/login');
  }

}