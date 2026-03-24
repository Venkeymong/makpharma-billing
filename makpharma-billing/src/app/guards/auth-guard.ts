import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {

  const auth = inject(AuthService);
  const router = inject(Router);

  try {

    /* ================= CHECK TOKEN ================= */

    const isLoggedIn = auth.isLoggedIn();
    const user = auth.getUser();

    if (!isLoggedIn || !user) {

      // ✅ Save attempted URL (for redirect after login)
      localStorage.setItem('redirectUrl', state.url);

      router.navigate(['/login']);
      return false;
    }

    /* ================= ROLE BASED ACCESS ================= */

    const allowedRoles = route.data?.['roles'];

    if (allowedRoles && Array.isArray(allowedRoles)) {

      if (!user.role || !allowedRoles.includes(user.role)) {

        console.warn('Access Denied: Role mismatch');

        // ✅ Redirect safely
        router.navigate(['/dashboard']);
        return false;
      }
    }

    /* ================= TOKEN VALIDATION (BASIC) ================= */

    const token = localStorage.getItem('token');

    if (!token) {
      auth.logout();
      router.navigate(['/login']);
      return false;
    }

    /* ================= SUCCESS ================= */

    return true;

  } catch (error) {

    console.error('Auth Guard Error:', error);

    // 🔐 Fail safe (security first)
    auth.logout();
    router.navigate(['/login']);

    return false;
  }

};