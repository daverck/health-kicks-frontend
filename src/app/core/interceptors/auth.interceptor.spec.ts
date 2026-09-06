import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { authInterceptor, resetAuthInterceptorState } from './auth.interceptor';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { TokenResponse } from '../../models/api.models';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    localStorage.clear();
    resetAuthInterceptorState();
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout', 'getAccessToken', 'refreshToken']);
    authServiceSpy.getAccessToken.and.callFake(() =>
      localStorage.getItem('access_token') || localStorage.getItem('hk_access_token')
    );
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['error', 'success', 'info']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
    resetAuthInterceptorState();
  });

  describe('Nominal requests & header injection', () => {
    it('should attach Authorization Bearer token when token is present and URL is API URL', () => {
      localStorage.setItem('access_token', 'my-test-jwt');

      httpClient.get(`${environment.apiUrl}/api/v1/devices`).subscribe();

      const req = httpTesting.expectOne(`${environment.apiUrl}/api/v1/devices`);
      expect(req.request.headers.has('Authorization')).toBeTrue();
      expect(req.request.headers.get('Authorization')).toBe('Bearer my-test-jwt');
      req.flush([]);
    });

    it('should NOT attach Authorization header if no token in localStorage', () => {
      httpClient.get(`${environment.apiUrl}/api/v1/devices`).subscribe();

      const req = httpTesting.expectOne(`${environment.apiUrl}/api/v1/devices`);
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush([]);
    });

    it('should NOT attach Authorization header if request is to external URL', () => {
      localStorage.setItem('access_token', 'my-test-jwt');

      httpClient.get('https://other-domain.com/data').subscribe();

      const req = httpTesting.expectOne('https://other-domain.com/data');
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({});
    });

    it('should NOT attach Authorization header on auth bypass URLs', () => {
      localStorage.setItem('access_token', 'my-test-jwt');

      httpClient.post(`${environment.apiUrl}/api/v1/auth/refresh`, { refresh_token: 'dummy' }).subscribe();

      const req = httpTesting.expectOne(`${environment.apiUrl}/api/v1/auth/refresh`);
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({});
    });
  });

  describe('401 error handling & token refresh', () => {
    it('should intercept 401, call authService.refreshToken() and replay the request with the new access token', () => {
      localStorage.setItem('access_token', 'expired-token');

      const refreshResult: TokenResponse = {
        access_token: 'brand-new-access-token',
        refresh_token: 'brand-new-refresh-token',
        token_type: 'bearer',
      };
      authServiceSpy.refreshToken.and.returnValue(of(refreshResult));

      let resultData: unknown = null;
      httpClient.get(`${environment.apiUrl}/api/v1/devices`).subscribe((data) => {
        resultData = data;
      });

      // 1. Initial request fails with 401
      const initialReq = httpTesting.expectOne(`${environment.apiUrl}/api/v1/devices`);
      expect(initialReq.request.headers.get('Authorization')).toBe('Bearer expired-token');
      initialReq.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      // 2. AuthService.refreshToken was invoked
      expect(authServiceSpy.refreshToken).toHaveBeenCalledTimes(1);

      // 3. Replayed request is sent with the new token
      const replayedReq = httpTesting.expectOne(`${environment.apiUrl}/api/v1/devices`);
      expect(replayedReq.request.headers.get('Authorization')).toBe('Bearer brand-new-access-token');
      replayedReq.flush([{ id: 1, name: 'Sensor 1' }]);

      // 4. Subscriber received the replayed response data
      expect(resultData).toEqual([{ id: 1, name: 'Sensor 1' }]);
      expect(authServiceSpy.logout).not.toHaveBeenCalled();
      expect(toastServiceSpy.error).not.toHaveBeenCalled();
    });

    it('should queue concurrent 401 requests, execute only ONE refresh call, and replay all requests', () => {
      localStorage.setItem('access_token', 'expired-token');

      const refreshSubject = new Subject<TokenResponse>();
      authServiceSpy.refreshToken.and.returnValue(refreshSubject.asObservable());

      let res1: unknown = null;
      let res2: unknown = null;

      httpClient.get(`${environment.apiUrl}/api/v1/devices`).subscribe((data) => {
        res1 = data;
      });
      httpClient.get(`${environment.apiUrl}/api/v1/fall-events`).subscribe((data) => {
        res2 = data;
      });

      // 1. Flush both initial requests with 401
      const req1 = httpTesting.expectOne(`${environment.apiUrl}/api/v1/devices`);
      const req2 = httpTesting.expectOne(`${environment.apiUrl}/api/v1/fall-events`);
      req1.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
      req2.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      // 2. Exactly ONE refresh call must have been made
      expect(authServiceSpy.refreshToken).toHaveBeenCalledTimes(1);

      // 3. Refresh resolves with new token
      refreshSubject.next({
        access_token: 'concurrent-refreshed-token',
        refresh_token: 'rotated-refresh-token',
        token_type: 'bearer',
      });
      refreshSubject.complete();

      // 4. Both requests are replayed with the new token
      const replayedReq1 = httpTesting.expectOne(`${environment.apiUrl}/api/v1/devices`);
      const replayedReq2 = httpTesting.expectOne(`${environment.apiUrl}/api/v1/fall-events`);

      expect(replayedReq1.request.headers.get('Authorization')).toBe('Bearer concurrent-refreshed-token');
      expect(replayedReq2.request.headers.get('Authorization')).toBe('Bearer concurrent-refreshed-token');

      replayedReq1.flush([{ id: 1, device_id: 'DEV-1' }]);
      replayedReq2.flush({ items: [], total: 0 });

      expect(res1).toEqual([{ id: 1, device_id: 'DEV-1' }]);
      expect(res2).toEqual({ items: [], total: 0 });
      expect(authServiceSpy.logout).not.toHaveBeenCalled();
    });

    it('should call authService.logout, show toast error and rethrow when refreshToken() fails', () => {
      localStorage.setItem('access_token', 'expired-token');

      authServiceSpy.refreshToken.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }))
      );

      let caughtError: HttpErrorResponse | null = null;
      httpClient.get(`${environment.apiUrl}/api/v1/auth/me`).subscribe({
        next: () => fail('Should have failed after refresh failure'),
        error: (err: HttpErrorResponse) => {
          caughtError = err;
        },
      });

      const req = httpTesting.expectOne(`${environment.apiUrl}/api/v1/auth/me`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(authServiceSpy.refreshToken).toHaveBeenCalledTimes(1);
      expect(authServiceSpy.logout).toHaveBeenCalledWith('/login');
      expect(toastServiceSpy.error).toHaveBeenCalledWith('Votre session a expiré. Veuillez vous reconnecter.');
      expect(caughtError).not.toBeNull();
      expect((caughtError as unknown as HttpErrorResponse)?.status).toBe(401);
    });

    it('should NOT attempt refresh or call logout on 401 when the request is an auth bypass endpoint (e.g. login)', () => {
      httpClient.post(`${environment.apiUrl}/api/v1/auth/login`, { email: 'bad@healthkicks.local', password: 'bad' }).subscribe({
        next: () => fail('Should have failed with 401'),
        error: (err: HttpErrorResponse) => {
          expect(err.status).toBe(401);
        },
      });

      const req = httpTesting.expectOne(`${environment.apiUrl}/api/v1/auth/login`);
      req.flush('Bad credentials', { status: 401, statusText: 'Unauthorized' });

      expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();
      expect(authServiceSpy.logout).not.toHaveBeenCalled();
      expect(toastServiceSpy.error).not.toHaveBeenCalled();
    });
  });
});
