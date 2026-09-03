import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/**
 * Injects the JWT as `Authorization: Bearer <token>` on every request to the
 * API, and automatically logs out with a clear toast on 401 Unauthorized responses.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);
  const token = localStorage.getItem('hk_access_token');

  const isApiRequest = req.url.startsWith(environment.apiUrl);
  const isAuthLoginRequest =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/google/callback');

  const authReq = token && isApiRequest
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        isApiRequest &&
        !isAuthLoginRequest
      ) {
        const auth = injector.get(AuthService);
        const toast = injector.get(ToastService);

        auth.logout('/login');
        toast.error('Votre session a expiré. Veuillez vous reconnecter.');
      }
      return throwError(() => error);
    })
  );
};
