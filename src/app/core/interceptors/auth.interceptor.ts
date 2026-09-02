import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

/**
 * Injects the JWT as `Authorization: Bearer <token>` on every request to the
 * API, and redirects to /login on 401 responses.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('hk_access_token');
  const router = inject(Router);

  const isApiRequest = req.url.startsWith(environment.apiUrl);
  const authReq = token && isApiRequest
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && isApiRequest) {
        localStorage.removeItem('hk_access_token');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
