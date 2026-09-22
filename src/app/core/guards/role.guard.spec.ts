import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { clinicianOrAdminGuard } from './role.guard';
import { AuthService } from '../services/auth.service';
import { UserResponse } from '../../models/api.models';

describe('Role Guard (clinicianOrAdminGuard)', () => {
  let authServiceSpy: {
    isAuthenticated: jasmine.Spy;
    currentUser: ReturnType<typeof signal<UserResponse | null>>;
    user: ReturnType<typeof signal<UserResponse | null>>;
  };
  let router: Router;

  const mockAdmin: UserResponse = {
    id: 1,
    email: 'admin@test.com',
    role: 'admin',
    is_active: true,
  };

  const mockClinician: UserResponse = {
    id: 2,
    email: 'clinician@test.com',
    role: 'clinician',
    is_active: true,
  };

  const mockUser: UserResponse = {
    id: 3,
    email: 'user@test.com',
    role: 'user',
    is_active: true,
  };

  beforeEach(() => {
    const userSignal = signal<UserResponse | null>(null);
    authServiceSpy = {
      isAuthenticated: jasmine.createSpy('isAuthenticated'),
      currentUser: userSignal,
      user: userSignal,
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

  it('should redirect unauthenticated users to /login with returnUrl', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);
    authServiceSpy.currentUser.set(null);

    const dummyRoute = {} as ActivatedRouteSnapshot;
    const dummyState = { url: '/dashboard/studio' } as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() => clinicianOrAdminGuard(dummyRoute, dummyState));
    expect(result).not.toBeTrue();
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/dashboard/studio' },
    });
  });

  it('should allow access for authenticated admin', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.currentUser.set(mockAdmin);

    const dummyRoute = {} as ActivatedRouteSnapshot;
    const dummyState = { url: '/dashboard/studio' } as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() => clinicianOrAdminGuard(dummyRoute, dummyState));
    expect(result).toBeTrue();
  });

  it('should allow access for authenticated clinician', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.currentUser.set(mockClinician);

    const dummyRoute = {} as ActivatedRouteSnapshot;
    const dummyState = { url: '/dashboard/studio/history' } as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() => clinicianOrAdminGuard(dummyRoute, dummyState));
    expect(result).toBeTrue();
  });

  it('should redirect authenticated regular user with role "user" to /dashboard', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.currentUser.set(mockUser);

    const dummyRoute = {} as ActivatedRouteSnapshot;
    const dummyState = { url: '/dashboard/studio' } as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() => clinicianOrAdminGuard(dummyRoute, dummyState));
    expect(result).not.toBeTrue();
    expect(router.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
  });
});

