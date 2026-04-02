import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class Navbar implements OnInit {

  user: any = {};

  // profile popup control
  showProfilePopup: boolean = false;

  profile: any = {};
  verifyPassword: string = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  /* ================= INIT ================= */

  ngOnInit(): void {
    this.loadUser();
  }

  /* ================= LOAD USER ================= */

  loadUser(): void {
    const userData = this.auth.getUser();

    if (userData) {
      this.user = userData;
    }
  }

  /* ================= SIDEBAR ================= */

  toggleSidebar(): void {
    const layout = document.querySelector('.main-layout');

    if (layout) {
      layout.classList.toggle('sidebar-collapsed');
    }
  }

  /* ================= OPEN PROFILE PAGE ================= */

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  /* ================= PROFILE POPUP (OPTIONAL) ================= */

  toggleProfilePopup(): void {

    const userData = this.auth.getUser();

    if (!userData) {
      this.logout();
      return;
    }

    this.profile = { ...userData };
    this.showProfilePopup = !this.showProfilePopup;
  }

  /* ================= SAVE PROFILE ================= */

  saveProfile(): void {

    const user = this.auth.getUser();

    if (!user) {
      alert("Session expired. Login again.");
      this.logout();
      return;
    }

    // basic verification
    if (!this.verifyPassword) {
      alert("Enter login password!");
      return;
    }

    this.auth.updateUser(this.profile);

    this.loadUser();

    this.verifyPassword = '';
    this.showProfilePopup = false;

    alert("Profile updated successfully!");
  }

  /* ================= LOGOUT ================= */

  logout(): void {

    this.auth.logout();

    // prevent back navigation
    window.location.href = '/login';
  }

}