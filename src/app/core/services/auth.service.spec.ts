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

  it('should fetch Google authorization URL and signed state from backend with getGoogleLoginUrl()', () => {
    const mockGoogleLogin = {
      authorization_url:
        'https://accounts.google.com/o/oauth2/v2/auth?client_id=123&state=signed-state-backend',
      state: 'signed-state-backend',
    };

    service.getGoogleLoginUrl().subscribe((res) => {
      expect(res.authorization_url).toBe(mockGoogleLogin.authorization_url);
      expect(res.state).toBe(mockGoogleLogin.state);
    });

    const req = httpTesting.expectOne(
      `${environment.apiUrl}/api/v1/auth/google/login?redirect=false`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockGoogleLogin);
  });

  it('should initiate loginWithGoogle, store signed state in sessionStorage and redirect', () => {
    sessionStorage.clear();
    spyOn(service, 'redirectTo');
    const mockGoogleLogin = {
      authorization_url:
        'https://accounts.google.com/o/oauth2/v2/auth?client_id=123&state=signed-state-backend',
      state: 'signed-state-backend',
    };

    service.loginWithGoogle();

    const req = httpTesting.expectOne(
      `${environment.apiUrl}/api/v1/auth/google/login?redirect=false`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockGoogleLogin);

    expect(sessionStorage.getItem('google_oauth_state')).toBe('signed-state-backend');
    expect(service.redirectTo).toHaveBeenCalledWith(mockGoogleLogin.authorization_url);
  });

  it('should validate and consume Google state from sessionStorage', () => {
    sessionStorage.setItem('google_oauth_state', 'expected-state');
    expect(service.validateGoogleState('wrong-state')).toBeFalse();
    expect(sessionStorage.getItem('google_oauth_state')).toBeNull();

    sessionStorage.setItem('google_oauth_state', 'matching-state');
    expect(service.validateGoogleState('matching-state')).toBeTrue();
    expect(sessionStorage.getItem('google_oauth_state')).toBeNull();

    expect(service.validateGoogleState(null)).toBeFalse();
  });

  it('should handle Google callback code and state via POST and establish session', () => {
    service.handleGoogleCallback('test-auth-code', 'test-state').subscribe((res) => {
      expect(res.access_token).toBe(MOCK_TOKEN);
      expect(res.user?.email).toBe('test@healthkicks.local');
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/api/v1/auth/google/callback`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ code: 'test-auth-code', state: 'test-state' });
    req.flush(mockLoginResponse);

    expect(localStorage.getItem('hk_access_token')).toBe(MOCK_TOKEN);
    expect(service.token()).toBe(MOCK_TOKEN);
    expect(service.user()).toEqual(mockUser);
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

  it('should support unified getOAuthLoginUrl and handleOAuthCallback for generic providers', () => {
    service.getOAuthLoginUrl('google').subscribe((res) => {
      expect(res.authorization_url).toContain('accounts.google.com');
    });
    const loginReq = httpTesting.expectOne(`${environment.apiUrl}/api/v1/auth/google/login?redirect=false`);
    loginReq.flush({ authorization_url: 'https://accounts.google.com/oauth', state: 's-123' });

    service.handleOAuthCallback('google', 'c-1', 's-1').subscribe((res) => {
      expect(res.access_token).toBe(MOCK_TOKEN);
    });
    const cbReq = httpTesting.expectOne(`${environment.apiUrl}/api/v1/auth/google/callback`);
    expect(cbReq.request.method).toBe('POST');
    expect(cbReq.request.body).toEqual({ code: 'c-1', state: 's-1' });
    cbReq.flush(mockLoginResponse);
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
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(service.token()).toBeNull();
    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);

    service.logout('/');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });

  describe('Token management & Refresh', () => {
    it('should return null for getAccessToken and getRefreshToken when storage is empty', () => {
      expect(service.getAccessToken()).toBeNull();
      expect(service.getRefreshToken()).toBeNull();
      expect(service.getToken()).toBeNull();
    });

    it('should retrieve access_token and refresh_token from localStorage', () => {
      localStorage.setItem('access_token', 'jwt-access');
      localStorage.setItem('refresh_token', 'jwt-refresh');

      expect(service.getAccessToken()).toBe('jwt-access');
      expect(service.getToken()).toBe('jwt-access');
      expect(service.getRefreshToken()).toBe('jwt-refresh');
    });

    it('should support legacy hk_access_token fallback in getAccessToken', () => {
      localStorage.setItem('hk_access_token', 'legacy-jwt');

      expect(service.getAccessToken()).toBe('legacy-jwt');
      expect(service.getToken()).toBe('legacy-jwt');
    });

    it('should store both access_token and refresh_token when setSession is called with TokenResponse', () => {
      service.setSession({
        access_token: 'new-at',
        refresh_token: 'new-rt',
        token_type: 'bearer',
        user: mockUser,
      });

      expect(localStorage.getItem('access_token')).toBe('new-at');
      expect(localStorage.getItem('refresh_token')).toBe('new-rt');
      expect(localStorage.getItem('hk_access_token')).toBe('new-at');
      expect(service.token()).toBe('new-at');
      expect(service.user()).toEqual(mockUser);
      expect(service.isAuthenticated()).toBeTrue();
    });

    it('should refresh tokens via POST /api/v1/auth/refresh and update session with rotated tokens', () => {
      localStorage.setItem('refresh_token', 'current-rt');

      const refreshResponse = {
        access_token: 'rotated-at',
        refresh_token: 'rotated-rt',
        token_type: 'bearer',
        user: mockUser,
      };

      service.refreshToken().subscribe((res) => {
        expect(res).toEqual(refreshResponse);
      });

      const req = httpTesting.expectOne(`${environment.apiUrl}/api/v1/auth/refresh`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refresh_token: 'current-rt' });
      req.flush(refreshResponse);

      expect(service.getAccessToken()).toBe('rotated-at');
      expect(service.getRefreshToken()).toBe('rotated-rt');
      expect(service.token()).toBe('rotated-at');
      expect(service.user()).toEqual(mockUser);
    });

    it('should throw an error if refreshToken is called without an available refresh token', (done) => {
      service.refreshToken().subscribe({
        next: () => {
          fail('Should not succeed when refresh token is missing');
          done();
        },
        error: (err) => {
          expect(err.message).toBe('No refresh token available');
          httpTesting.expectNone(`${environment.apiUrl}/api/v1/auth/refresh`);
          done();
        },
      });
    });

    it('should remove both access_token and refresh_token on clearSession()', () => {
      localStorage.setItem('access_token', 'at');
      localStorage.setItem('refresh_token', 'rt');
      localStorage.setItem('hk_access_token', 'at');

      service.clearSession();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(localStorage.getItem('hk_access_token')).toBeNull();
      expect(service.token()).toBeNull();
      expect(service.user()).toBeNull();
    });
  });
});

