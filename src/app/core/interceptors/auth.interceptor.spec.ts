import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    localStorage.clear();
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
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
  });

  it('should attach Authorization Bearer token when token is present and URL is API URL', () => {
    localStorage.setItem('hk_access_token', 'my-test-jwt');

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
    localStorage.setItem('hk_access_token', 'my-test-jwt');

    httpClient.get('https://other-domain.com/data').subscribe();

    const req = httpTesting.expectOne('https://other-domain.com/data');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should call auth.logout() and show toast error on 401 response from protected API', () => {
    localStorage.setItem('hk_access_token', 'expired-token');

    httpClient.get(`${environment.apiUrl}/api/v1/auth/me`).subscribe({
      next: () => fail('Should have failed with 401'),
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(401);
      },
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/api/v1/auth/me`);
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.logout).toHaveBeenCalledWith('/login');
    expect(toastServiceSpy.error).toHaveBeenCalledWith('Votre session a expiré. Veuillez vous reconnecter.');
  });

  it('should NOT call auth.logout() on 401 when the request is a login attempt', () => {
    httpClient.post(`${environment.apiUrl}/api/v1/auth/login`, { email: 'bad@healthkicks.local', password: 'bad' }).subscribe({
      next: () => fail('Should have failed with 401'),
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(401);
      },
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/api/v1/auth/login`);
    req.flush('Bad credentials', { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.logout).not.toHaveBeenCalled();
    expect(toastServiceSpy.error).not.toHaveBeenCalled();
  });
});
