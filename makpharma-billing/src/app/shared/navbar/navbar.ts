import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class Navbar {

  user:any;

  constructor(
    private auth:AuthService,
    private router:Router
  ){
    this.user = this.auth.getUser();
  }

toggleSidebar() {
  const layout = document.querySelector('.main-layout');

  if (layout) {
    layout.classList.toggle('sidebar-collapsed');
  }
}

  logout(){

    this.auth.logout();
    this.router.navigate(['/login']);

  }

}