import { Component } from '@angular/core';
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
export class Login {

  username: string = '';
  password: string = '';
  error: string = '';

  loading: boolean = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  /* ================= LOGIN ================= */

  async login(): Promise<void> {

    // reset error
    this.error = '';
    this.loading = true;

    try {

      const success = await this.auth.login(
        this.username,
        this.password
      );

      if (success) {

        this.router.navigate(['/dashboard']);

      } else {

        this.error = 'Invalid username or password';

      }

    } catch (err) {

      console.error('Login Error:', err);
      this.error = 'Something went wrong. Please try again.';

    } finally {

      this.loading = false;

    }
  }

}