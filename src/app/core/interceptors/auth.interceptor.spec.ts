import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { environment } from '../../../environments/environment';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    localStorage.clear();
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
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

  it('should clear token and redirect to /login on 401 response from API', () => {
    localStorage.setItem('hk_access_token', 'expired-token');

    httpClient.get(`${environment.apiUrl}/api/v1/auth/me`).subscribe({
      next: () => fail('Should have failed with 401'),
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(401);
      },
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/api/v1/auth/me`);
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(localStorage.getItem('hk_access_token')).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});

