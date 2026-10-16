import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError, firstValueFrom, Observable } from 'rxjs';
import { clinicianOrAdminGuard } from './role.guard';
import { AuthService } from '../services/auth.service';
import { UserResponse } from '../../models/api.models';

describe('Role Guard (clinicianOrAdminGuard)', () => {
  let authServiceSpy: {
    isAuthenticated: jasmine.Spy;
    currentUser: ReturnType<typeof signal<UserResponse | null>>;
    user: ReturnType<typeof signal<UserResponse | null>>;
    loadMe: jasmine.Spy;
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
      loadMe: jasmine.createSpy('loadMe').and.returnValue(of(mockClinician)),
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

  it('should call loadMe when authenticated but currentUser is not yet loaded, and allow clinician', async () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.currentUser.set(null);
    authServiceSpy.loadMe.and.returnValue(of(mockClinician));

    const dummyRoute = {} as ActivatedRouteSnapshot;
    const dummyState = { url: '/dashboard/studio/history/session-123' } as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() => clinicianOrAdminGuard(dummyRoute, dummyState));
    expect(authServiceSpy.loadMe).toHaveBeenCalled();

    const allowed = await firstValueFrom(result as Observable<boolean | UrlTree>);
    expect(allowed).toBeTrue();
  });

  it('should call loadMe when authenticated but currentUser is not yet loaded, and redirect regular user to /dashboard', async () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.currentUser.set(null);
    authServiceSpy.loadMe.and.returnValue(of(mockUser));

    const dummyRoute = {} as ActivatedRouteSnapshot;
    const dummyState = { url: '/dashboard/studio/history/session-123' } as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() => clinicianOrAdminGuard(dummyRoute, dummyState));
    expect(authServiceSpy.loadMe).toHaveBeenCalled();

    const tree = await firstValueFrom(result as Observable<boolean | UrlTree>);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    expect(tree).toEqual(jasmine.objectContaining({ commands: ['/dashboard'] }));
  });

  it('should call loadMe and redirect to /login if loadMe fails with 401/error', async () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.currentUser.set(null);
    authServiceSpy.loadMe.and.returnValue(throwError(() => new Error('Session expired')));

    const dummyRoute = {} as ActivatedRouteSnapshot;
    const dummyState = { url: '/dashboard/studio/history/session-123' } as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() => clinicianOrAdminGuard(dummyRoute, dummyState));
    expect(authServiceSpy.loadMe).toHaveBeenCalled();

    const tree = await firstValueFrom(result as Observable<boolean | UrlTree>);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/dashboard/studio/history/session-123' },
    });
    expect(tree).toEqual(jasmine.objectContaining({ commands: ['/login'] }));
  });

  it('should block and redirect to /dashboard if localStorage user role was tampered to admin but JWT token claims role "user"', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.currentUser.set(mockAdmin);
    (authServiceSpy as any).getUserFromToken = jasmine.createSpy('getUserFromToken').and.returnValue(mockUser);

    const dummyRoute = {} as ActivatedRouteSnapshot;
    const dummyState = { url: '/dashboard/studio' } as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() => clinicianOrAdminGuard(dummyRoute, dummyState));
    expect(result).not.toBeTrue();
    expect(router.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
  });
});

