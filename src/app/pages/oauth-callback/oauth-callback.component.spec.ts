import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { OAuthCallbackComponent } from './oauth-callback.component';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { mockUser, MOCK_TOKEN } from '../../../testing/mocks/auth.mock';

describe('OAuthCallbackComponent', () => {
  let fixture: ComponentFixture<OAuthCallbackComponent>;
  let component: OAuthCallbackComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let queryParams: Record<string, string | null>;
  let paramMap: Record<string, string>;

  const setup = async (
    params: Record<string, string | null>,
    providerParam: string = 'google'
  ) => {
    queryParams = params;
    paramMap = { provider: providerParam };
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'validateOAuthState',
      'handleOAuthCallback',
    ]);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);

    await TestBed.configureTestingModule({
      imports: [OAuthCallbackComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => paramMap[key] ?? null,
              },
              queryParamMap: {
                get: (key: string) => queryParams[key] ?? null,
              },
              routeConfig: { path: `auth/${providerParam}/callback` },
            },
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    fixture = TestBed.createComponent(OAuthCallbackComponent);
    component = fixture.componentInstance;
  };

  describe('Google provider flow', () => {
    it('should handle access_denied error when user cancels Google login', async () => {
      await setup({ error: 'access_denied' }, 'google');
      fixture.detectChanges();

      expect(component.error()).toContain('Google');
      expect(component.error()).toContain('Connexion annulée');
      expect(toastServiceSpy.error).toHaveBeenCalledWith(
        jasmine.stringMatching(/Connexion annulée/)
      );
      expect(authServiceSpy.handleOAuthCallback).not.toHaveBeenCalled();
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should handle generic OAuth error from Google', async () => {
      await setup({ error: 'invalid_request', error_description: 'Bad request from Google' }, 'google');
      fixture.detectChanges();

      expect(component.error()).toBe('Bad request from Google');
      expect(toastServiceSpy.error).toHaveBeenCalledWith('Bad request from Google');
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should report error when code or state parameter is missing', async () => {
      await setup({ code: 'some-code' }, 'google'); // state missing
      fixture.detectChanges();

      expect(component.error()).toContain('manquants');
      expect(authServiceSpy.validateOAuthState).not.toHaveBeenCalled();
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should reject when anti-CSRF state validation fails', async () => {
      await setup({ code: 'valid-code', state: 'invalid-state' }, 'google');
      authServiceSpy.validateOAuthState.and.returnValue(false);

      fixture.detectChanges();

      expect(authServiceSpy.validateOAuthState).toHaveBeenCalledWith('google', 'invalid-state');
      expect(component.error()).toContain('state');
      expect(authServiceSpy.handleOAuthCallback).not.toHaveBeenCalled();
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should exchange code and navigate to /dashboard on success', async () => {
      await setup({ code: 'valid-code', state: 'valid-state' }, 'google');
      authServiceSpy.validateOAuthState.and.returnValue(true);
      authServiceSpy.handleOAuthCallback.and.returnValue(
        of({ access_token: MOCK_TOKEN, user: mockUser })
      );

      fixture.detectChanges();

      expect(authServiceSpy.validateOAuthState).toHaveBeenCalledWith('google', 'valid-state');
      expect(authServiceSpy.handleOAuthCallback).toHaveBeenCalledWith('google', 'valid-code', 'valid-state');
      expect(toastServiceSpy.success).toHaveBeenCalledWith('Connexion avec Google réussie !');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard/devices');
      expect(component.error()).toBeNull();
    });

    it('should handle backend callback failure and display error message', async () => {
      await setup({ code: 'valid-code', state: 'valid-state' }, 'google');
      authServiceSpy.validateOAuthState.and.returnValue(true);
      authServiceSpy.handleOAuthCallback.and.returnValue(
        throwError(() => ({ error: { detail: "Impossible de finaliser l'authentification Google. Veuillez réessayer." } }))
      );

      fixture.detectChanges();

      expect(component.error()).toBe("Impossible de finaliser l'authentification Google. Veuillez réessayer.");
      expect(toastServiceSpy.error).toHaveBeenCalledWith("Impossible de finaliser l'authentification Google. Veuillez réessayer.");
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });
  });

  describe('Microsoft (Azure) provider flow', () => {
    it('should handle access_denied error when user cancels Microsoft login', async () => {
      await setup({ error: 'access_denied' }, 'azure');
      fixture.detectChanges();

      expect(component.error()).toContain('Microsoft');
      expect(component.error()).toContain('Connexion annulée');
      expect(toastServiceSpy.error).toHaveBeenCalledWith(
        jasmine.stringMatching(/Connexion annulée/)
      );
      expect(authServiceSpy.handleOAuthCallback).not.toHaveBeenCalled();
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should exchange code and navigate to /dashboard on success for Microsoft', async () => {
      await setup({ code: 'azure-code', state: 'azure-state' }, 'azure');
      authServiceSpy.validateOAuthState.and.returnValue(true);
      authServiceSpy.handleOAuthCallback.and.returnValue(
        of({ access_token: MOCK_TOKEN, user: mockUser })
      );

      fixture.detectChanges();

      expect(authServiceSpy.validateOAuthState).toHaveBeenCalledWith('azure', 'azure-state');
      expect(authServiceSpy.handleOAuthCallback).toHaveBeenCalledWith('azure', 'azure-code', 'azure-state');
      expect(toastServiceSpy.success).toHaveBeenCalledWith('Connexion avec Microsoft réussie !');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard/devices');
      expect(component.error()).toBeNull();
    });
  });
});
