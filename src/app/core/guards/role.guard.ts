import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Restricts access to routes to users with 'clinician' or 'admin' roles.
 * Unauthenticated users are redirected to /login with returnUrl query parameter.
 * Authenticated users with insufficient privileges are redirected to /dashboard.
 * When authenticated but user profile is not yet in memory (e.g. cold start / new tab),
 * dynamically loads profile via loadMe() before deciding.
 */
export const clinicianOrAdminGuard: CanActivateFn = (
  _route,
  state
): Observable<boolean | UrlTree> | boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  // Security check: inspect the signed JWT claims if available to detect localStorage tampering
  const tokenUser = typeof auth.getUserFromToken === 'function' ? auth.getUserFromToken() : null;
  const currentUser = auth.currentUser ? auth.currentUser() : auth.user();

  // If the JWT payload explicitly contains role 'user', block elevation even if localStorage is tampered
  if (tokenUser && tokenUser.role === 'user') {
    return router.createUrlTree(['/dashboard']);
  }

  const role = currentUser?.role;

  if (role === 'admin' || role === 'clinician') {
    return true;
  }

  if (role === 'user') {
    return router.createUrlTree(['/dashboard']);
  }

  // If authenticated but user profile is not yet loaded into signal (e.g. cold start / new tab)
  return auth.loadMe().pipe(
    map((user) => {
      if (user.role === 'admin' || user.role === 'clinician') {
        return true;
      }
      return router.createUrlTree(['/dashboard']);
    }),
    catchError(() => of(router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })))
  );
};

