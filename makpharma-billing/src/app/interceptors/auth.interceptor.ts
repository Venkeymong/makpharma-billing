import { HttpInterceptorFn } from '@angular/common/http';
import { HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {

  const router = inject(Router);

  /* ================= GET TOKEN ================= */

  const token = localStorage.getItem('token');

  /* ================= CLONE REQUEST ================= */

  let modifiedReq = req;

  if (token) {

    modifiedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

  }

  /* ================= HANDLE RESPONSE ================= */

  return next(modifiedReq).pipe(

    catchError((error: HttpErrorResponse) => {

      /* 🔐 AUTO LOGOUT IF TOKEN EXPIRED */

      if (error.status === 401) {

        console.warn('Unauthorized - Logging out');

        localStorage.removeItem('token');
        localStorage.removeItem('user');

        router.navigate(['/login']);
      }

      return throwError(() => error);
    })

  );
};