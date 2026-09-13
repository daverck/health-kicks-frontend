import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { MockAuthService } from './mock-auth.service';
import { AuthService } from './auth.service';

describe('MockAuthService', () => {
  let service: MockAuthService;
  let httpTesting: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    localStorage.clear();
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        MockAuthService,
        { provide: AuthService, useExisting: MockAuthService },
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
      ],
    });

    service = TestBed.inject(MockAuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('devrait être instancié et pré-authentifié immédiatement', () => {
    expect(service).toBeTruthy();
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.getAccessToken()).toBe('mock-dev-jwt-token');
    expect(service.getToken()).toBe('mock-dev-jwt-token');
    expect(service.getRefreshToken()).toBe('mock-dev-refresh-token');
  });

  it('devrait exposer un profil utilisateur par défaut valide', () => {
    const user = service.user();
    expect(user).not.toBeNull();
    expect(user?.id).toBe(1);
    expect(user?.email).toBe('serckdavid@gmail.com');
    expect(user?.role).toBe('admin');
    expect(user?.name).toBe('David Serck');
    expect(user?.is_active).toBeTrue();
  });

  it('devrait retourner le profil mocké via loadMe sans appel HTTP', (done) => {
    service.loadMe().subscribe((user) => {
      expect(user.id).toBe(1);
      expect(user.email).toBe('serckdavid@gmail.com');
      expect(user.role).toBe('admin');
      done();
    });

    // Vérifie qu'aucun appel HTTP n'a été émis vers le backend
    httpTesting.expectNone(() => true);
  });

  it('devrait simuler le login avec succès sans appel HTTP', (done) => {
    service.login('autre@healthkicks.local', 'password').subscribe((res) => {
      expect(res.access_token).toBe('mock-dev-jwt-token');
      expect(res.user?.id).toBe(1);
      done();
    });

    httpTesting.expectNone(() => true);
  });

  it('devrait simuler le refresh token sans appel réseau', (done) => {
    service.refreshToken().subscribe((res) => {
      expect(res.access_token).toBe('mock-dev-jwt-token');
      done();
    });

    httpTesting.expectNone(() => true);
  });

  it('devrait simuler la connexion OAuth et rediriger vers le dashboard', () => {
    service.loginWithOAuth('google');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('devrait préserver l\'état authentifié même après logout en mode mock', () => {
    service.logout('/');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.getAccessToken()).toBe('mock-dev-jwt-token');
  });
});
