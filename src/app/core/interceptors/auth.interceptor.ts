import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { TokenResponse } from '../../models/api.models';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

/**
 * Resets the interceptor state (useful for unit testing).
 */
export function resetAuthInterceptorState(): void {
  isRefreshing = false;
  refreshTokenSubject.next(null);
}

function addTokenHeader(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Injects the JWT as `Authorization: Bearer <access_token>` on API requests,
 * and intercepts 401 Unauthorized responses to perform a transparent session
 * refresh using the refresh token before replaying queued requests.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);
  const authService = injector.get(AuthService);
  const toastService = injector.get(ToastService);

  const token = authService.getAccessToken();

  const isApiRequest = req.url.startsWith(environment.apiUrl);
  const isAuthBypassRequest =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/refresh') ||
    req.url.includes('/auth/google') ||
    req.url.includes('/auth/azure');

  const authReq = token && isApiRequest && !isAuthBypassRequest
    ? addTokenHeader(req, token)
    : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        isApiRequest &&
        !isAuthBypassRequest
      ) {
        // Cas 1 : Aucune procédure de refresh en cours
        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return authService.refreshToken().pipe(
            switchMap((res: TokenResponse) => {
              isRefreshing = false;
              refreshTokenSubject.next(res.access_token);
              return next(addTokenHeader(req, res.access_token));
            }),
            catchError((refreshError: unknown) => {
              isRefreshing = false;
              refreshTokenSubject.next(null);
              authService.logout('/login');
              toastService.error('Votre session a expiré. Veuillez vous reconnecter.');
              return throwError(() => refreshError);
            })
          );
        } else {
          // Cas 2 : Une procédure de refresh est déjà en cours -> mise en file d'attente
          return refreshTokenSubject.pipe(
            filter((newToken): newToken is string => newToken !== null),
            take(1),
            switchMap((newToken: string) => {
              return next(addTokenHeader(req, newToken));
            })
          );
        }
      }

      return throwError(() => error);
    })
  );
};
