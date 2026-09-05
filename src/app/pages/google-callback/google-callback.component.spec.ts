import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { GoogleCallbackComponent } from './google-callback.component';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { mockUser, MOCK_TOKEN } from '../../../testing/mocks/auth.mock';

describe('GoogleCallbackComponent', () => {
  let fixture: ComponentFixture<GoogleCallbackComponent>;
  let component: GoogleCallbackComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let queryParams: Record<string, string | null>;

  const setup = async (params: Record<string, string | null>) => {
    queryParams = params;
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'validateGoogleState',
      'handleGoogleCallback',
    ]);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);

    await TestBed.configureTestingModule({
      imports: [GoogleCallbackComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => queryParams[key] ?? null,
              },
            },
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    fixture = TestBed.createComponent(GoogleCallbackComponent);
    component = fixture.componentInstance;
  };

  it('should handle access_denied error when user cancels Google login', async () => {
    await setup({ error: 'access_denied' });
    fixture.detectChanges();

    expect(component.error()).toContain('Connexion annulée');
    expect(toastServiceSpy.error).toHaveBeenCalledWith(
      jasmine.stringMatching(/Connexion annulée/)
    );
    expect(authServiceSpy.handleGoogleCallback).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should handle generic OAuth error from Google', async () => {
    await setup({ error: 'invalid_request', error_description: 'Bad request from Google' });
    fixture.detectChanges();

    expect(component.error()).toBe('Bad request from Google');
    expect(toastServiceSpy.error).toHaveBeenCalledWith('Bad request from Google');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should report error when code or state parameter is missing', async () => {
    await setup({ code: 'some-code' }); // state missing
    fixture.detectChanges();

    expect(component.error()).toContain('manquants');
    expect(authServiceSpy.validateGoogleState).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should reject when anti-CSRF state validation fails', async () => {
    await setup({ code: 'valid-code', state: 'invalid-state' });
    authServiceSpy.validateGoogleState.and.returnValue(false);

    fixture.detectChanges();

    expect(authServiceSpy.validateGoogleState).toHaveBeenCalledWith('invalid-state');
    expect(component.error()).toContain('state');
    expect(authServiceSpy.handleGoogleCallback).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should exchange code and navigate to /dashboard on success', async () => {
    await setup({ code: 'valid-code', state: 'valid-state' });
    authServiceSpy.validateGoogleState.and.returnValue(true);
    authServiceSpy.handleGoogleCallback.and.returnValue(
      of({ access_token: MOCK_TOKEN, user: mockUser })
    );

    fixture.detectChanges();

    expect(authServiceSpy.validateGoogleState).toHaveBeenCalledWith('valid-state');
    expect(authServiceSpy.handleGoogleCallback).toHaveBeenCalledWith('valid-code', 'valid-state');
    expect(toastServiceSpy.success).toHaveBeenCalledWith('Connexion avec Google réussie !');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
    expect(component.error()).toBeNull();
  });

  it('should handle backend callback failure and display error message', async () => {
    await setup({ code: 'valid-code', state: 'valid-state' });
    authServiceSpy.validateGoogleState.and.returnValue(true);
    authServiceSpy.handleGoogleCallback.and.returnValue(
      throwError(() => ({ error: { detail: "Impossible de finaliser l'authentification Google. Veuillez réessayer." } }))
    );

    fixture.detectChanges();

    expect(component.error()).toBe("Impossible de finaliser l'authentification Google. Veuillez réessayer.");
    expect(toastServiceSpy.error).toHaveBeenCalledWith("Impossible de finaliser l'authentification Google. Veuillez réessayer.");
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
