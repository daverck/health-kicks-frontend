import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { mockUser, mockLoginResponse, mockRegisterPayload, MOCK_TOKEN } from '../../../testing/mocks/auth.mock';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    localStorage.clear();
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
      ],
    });

    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should be created and initial state reflects empty localStorage', () => {
    expect(service).toBeTruthy();
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.user()).toBeNull();
    expect(service.token()).toBeNull();
  });

  it('should login successfully and save token and user in session', () => {
    service.login('test@healthkicks.local', 'password123').subscribe((res) => {
      expect(res.access_token).toBe(MOCK_TOKEN);
      expect(res.user?.email).toBe('test@healthkicks.local');
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/api/v1/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'test@healthkicks.local', password: 'password123' });
    req.flush(mockLoginResponse);

    expect(localStorage.getItem('hk_access_token')).toBe(MOCK_TOKEN);
    expect(service.token()).toBe(MOCK_TOKEN);
    expect(service.user()).toEqual(mockUser);
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('should register successfully and establish session', () => {
    service.register(mockRegisterPayload).subscribe((res) => {
      expect(res.access_token).toBe(MOCK_TOKEN);
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/api/v1/auth/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockRegisterPayload);
    req.flush(mockLoginResponse);

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.token()).toBe(MOCK_TOKEN);
  });

  it('should handle Google callback code and exchange for token', () => {
    service.handleGoogleCallback('test-auth-code', 'test-state').subscribe((res) => {
      expect(res.access_token).toBe(MOCK_TOKEN);
    });

    const req = httpTesting.expectOne(
      `${environment.apiUrl}/api/v1/auth/google/callback?code=test-auth-code&state=test-state`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockLoginResponse);

    expect(service.isAuthenticated()).toBeTrue();
  });

  it('should fetch Microsoft authorization URL and signed state from backend with getAzureLoginUrl()', () => {
    const mockAzureLogin = {
      authorization_url:
        'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=123&state=signed-state-backend',
      state: 'signed-state-backend',
    };

    service.getAzureLoginUrl().subscribe((res) => {
      expect(res.authorization_url).toBe(mockAzureLogin.authorization_url);
      expect(res.state).toBe(mockAzureLogin.state);
    });

    const req = httpTesting.expectOne(
      `${environment.apiUrl}/api/v1/auth/azure/login?redirect=false`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockAzureLogin);
  });

  it('should initiate loginWithMicrosoft, store signed state in sessionStorage and redirect', () => {
    sessionStorage.clear();
    spyOn(service, 'redirectTo');
    const mockAzureLogin = {
      authorization_url:
        'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=123&state=signed-state-backend',
      state: 'signed-state-backend',
    };

    service.loginWithMicrosoft();

    const req = httpTesting.expectOne(
      `${environment.apiUrl}/api/v1/auth/azure/login?redirect=false`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockAzureLogin);

    expect(sessionStorage.getItem('azure_oauth_state')).toBe('signed-state-backend');
    expect(service.redirectTo).toHaveBeenCalledWith(mockAzureLogin.authorization_url);
  });

  it('should validate and consume state from sessionStorage', () => {

    sessionStorage.setItem('azure_oauth_state', 'expected-state');
    expect(service.validateAzureState('wrong-state')).toBeFalse();
    // After consumption, state is purged
    expect(sessionStorage.getItem('azure_oauth_state')).toBeNull();

    sessionStorage.setItem('azure_oauth_state', 'matching-state');
    expect(service.validateAzureState('matching-state')).toBeTrue();
    expect(sessionStorage.getItem('azure_oauth_state')).toBeNull();

    expect(service.validateAzureState(null)).toBeFalse();
  });

  it('should handle Microsoft callback code and state via POST and establish session', () => {
    service.handleAzureCallback('auth-code-123', 'state-456').subscribe((res) => {
      expect(res.access_token).toBe(MOCK_TOKEN);
      expect(res.user?.email).toBe('test@healthkicks.local');
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/api/v1/auth/azure/callback`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ code: 'auth-code-123', state: 'state-456' });
    req.flush(mockLoginResponse);

    expect(localStorage.getItem('hk_access_token')).toBe(MOCK_TOKEN);
    expect(service.token()).toBe(MOCK_TOKEN);
    expect(service.user()).toEqual(mockUser);
    expect(service.isAuthenticated()).toBeTrue();
  });


  it('should load user profile with loadMe()', () => {
    service.loadMe().subscribe((user) => {
      expect(user).toEqual(mockUser);
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/api/v1/auth/me`);
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);

    expect(service.user()).toEqual(mockUser);
  });

  it('should clear token and state on logout and redirect to login', () => {
    service.setSession(MOCK_TOKEN, mockUser);
    expect(service.isAuthenticated()).toBeTrue();

    service.logout();

    expect(localStorage.getItem('hk_access_token')).toBeNull();
    expect(service.token()).toBeNull();
    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);

    service.logout('/');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });
});

