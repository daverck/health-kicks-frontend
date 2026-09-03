import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { authGuard, guestGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('Auth Guards', () => {
  let authServiceSpy: { isAuthenticated: jasmine.Spy };
  let router: Router;

  beforeEach(() => {
    authServiceSpy = {
      isAuthenticated: jasmine.createSpy('isAuthenticated'),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        {
          provide: Router,
          useValue: {
            createUrlTree: jasmine.createSpy('createUrlTree').and.callFake(
              (commands: any[], extras?: any) => ({ commands, extras } as unknown as UrlTree)
            ),
          },
        },
      ],
    });

    router = TestBed.inject(Router);
  });

  describe('authGuard', () => {
    it('should allow activation when user is authenticated', () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);

      const dummyRoute = {} as ActivatedRouteSnapshot;
      const dummyState = { url: '/dashboard' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState));
      expect(result).toBeTrue();
    });

    it('should redirect to /login with returnUrl when not authenticated', () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);

      const dummyRoute = {} as ActivatedRouteSnapshot;
      const dummyState = { url: '/profile' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState));
      expect(result).not.toBeTrue();
      expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/profile' },
      });
    });
  });

  describe('guestGuard', () => {
    it('should allow activation when user is NOT authenticated', () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);

      const dummyRoute = {} as ActivatedRouteSnapshot;
      const dummyState = { url: '/login' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() => guestGuard(dummyRoute, dummyState));
      expect(result).toBeTrue();
    });

    it('should redirect to /dashboard when user IS already authenticated', () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);

      const dummyRoute = {} as ActivatedRouteSnapshot;
      const dummyState = { url: '/login' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() => guestGuard(dummyRoute, dummyState));
      expect(result).not.toBeTrue();
      expect(router.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    });
  });
});

