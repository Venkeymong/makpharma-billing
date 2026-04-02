import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {

  const auth = inject(AuthService);
  const router = inject(Router);

  try {

    /* ================= GET DATA ================= */

    const token = localStorage.getItem('token');
    const user = auth.getUser();

    /* ================= BASIC AUTH CHECK ================= */

    if (!token || !auth.isLoggedIn() || !user) {

      // Save attempted URL for redirect after login
      localStorage.setItem('redirectUrl', state.url);

      // Clear everything (important for back button issue)
      auth.logout();

      router.navigate(['/login'], { replaceUrl: true });
      return false;
    }

    /* ================= ROLE BASED ACCESS ================= */

    const allowedRoles = route.data?.['roles'];

    if (allowedRoles && Array.isArray(allowedRoles)) {

      if (!user.role || !allowedRoles.includes(user.role)) {

        console.warn('Access Denied: Role mismatch');

        router.navigate(['/dashboard'], { replaceUrl: true });
        return false;
      }
    }

    /* ================= OPTIONAL: TOKEN EXPIRY CHECK ================= */

    // If you store expiry in future, you can validate here
    // Example:
    // const expiry = localStorage.getItem('tokenExpiry');
    // if (expiry && Date.now() > Number(expiry)) {
    //   auth.logout();
    //   router.navigate(['/login'], { replaceUrl: true });
    //   return false;
    // }

    /* ================= SUCCESS ================= */

    return true;

  } catch (error) {

    console.error('Auth Guard Error:', error);

    // 🔐 Fail-safe (VERY IMPORTANT)
    auth.logout();
    router.navigate(['/login'], { replaceUrl: true });

    return false;
  }

};