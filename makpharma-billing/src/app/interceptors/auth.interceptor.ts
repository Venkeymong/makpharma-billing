import { HttpInterceptorFn } from '@angular/common/http';
import { HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {

  const auth = inject(AuthService);
  const router = inject(Router);

  /* =========================================
     🔐 GET TOKEN (CENTRALIZED)
  ========================================= */

  const token = auth.getToken();

  /* =========================================
     🚀 ATTACH TOKEN
  ========================================= */

  let modifiedReq = req;

  if (token && auth.isTokenValid()) {

    modifiedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

  }

  /* =========================================
     🚨 GLOBAL ERROR HANDLING
  ========================================= */

  return next(modifiedReq).pipe(

    catchError((error: HttpErrorResponse) => {

      /* ================= 401 ================= */

      if (error.status === 401) {

        console.warn('🔐 Unauthorized - Session expired');

        // Prevent multiple redirects loop
        if (auth.isLoggedIn()) {
          auth.logout();
          router.navigate(['/login'], { replaceUrl: true });
        }
      }

      /* ================= 403 ================= */

      if (error.status === 403) {
        console.warn('🚫 Forbidden access');
      }

      /* ================= 500 ================= */

      if (error.status === 500) {
        console.error('🔥 Server error occurred');
      }

      return throwError(() => error);

    })

  );
};