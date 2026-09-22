import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Restricts access to routes to users with 'clinician' or 'admin' roles.
 * Unauthenticated users are redirected to /login with returnUrl query parameter.
 * Authenticated users with insufficient privileges are redirected to /dashboard.
 */
export const clinicianOrAdminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  const role = auth.currentUser ? auth.currentUser()?.role : auth.user()?.role;
  if (role === 'admin' || role === 'clinician') {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};

