import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AzureCallbackComponent } from './azure-callback.component';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { mockUser, MOCK_TOKEN } from '../../../testing/mocks/auth.mock';

describe('AzureCallbackComponent', () => {
  let fixture: ComponentFixture<AzureCallbackComponent>;
  let component: AzureCallbackComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let queryParams: Record<string, string | null>;

  const setup = async (params: Record<string, string | null>) => {
    queryParams = params;
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'validateAzureState',
      'handleAzureCallback',
    ]);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);

    await TestBed.configureTestingModule({
      imports: [AzureCallbackComponent],
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

    fixture = TestBed.createComponent(AzureCallbackComponent);
    component = fixture.componentInstance;
  };


  it('should handle access_denied error when user cancels Microsoft login', async () => {
    await setup({ error: 'access_denied' });
    fixture.detectChanges();

    expect(component.error()).toContain("Connexion annulée");
    expect(toastServiceSpy.error).toHaveBeenCalledWith(
      jasmine.stringMatching(/Connexion Microsoft annulée|Connexion annulée/)
    );
    expect(authServiceSpy.handleAzureCallback).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should handle generic OAuth error from Microsoft', async () => {
    await setup({ error: 'invalid_request', error_description: 'Bad request from identity provider' });
    fixture.detectChanges();

    expect(component.error()).toBe('Bad request from identity provider');
    expect(toastServiceSpy.error).toHaveBeenCalledWith('Bad request from identity provider');
  });

  it('should report error when code or state parameter is missing', async () => {
    await setup({ code: 'some-code' }); // state missing
    fixture.detectChanges();

    expect(component.error()).toContain('manquants');
    expect(authServiceSpy.validateAzureState).not.toHaveBeenCalled();
  });

  it('should reject when anti-CSRF state validation fails', async () => {
    await setup({ code: 'valid-code', state: 'invalid-state' });
    authServiceSpy.validateAzureState.and.returnValue(false);

    fixture.detectChanges();

    expect(authServiceSpy.validateAzureState).toHaveBeenCalledWith('invalid-state');
    expect(component.error()).toContain('state');
    expect(authServiceSpy.handleAzureCallback).not.toHaveBeenCalled();
  });

  it('should exchange code and navigate to /dashboard on success', async () => {
    await setup({ code: 'valid-code', state: 'valid-state' });
    authServiceSpy.validateAzureState.and.returnValue(true);
    authServiceSpy.handleAzureCallback.and.returnValue(
      of({ access_token: MOCK_TOKEN, user: mockUser })
    );

    fixture.detectChanges();

    expect(authServiceSpy.validateAzureState).toHaveBeenCalledWith('valid-state');
    expect(authServiceSpy.handleAzureCallback).toHaveBeenCalledWith('valid-code', 'valid-state');
    expect(toastServiceSpy.success).toHaveBeenCalledWith('Connexion avec Microsoft réussie !');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
    expect(component.error()).toBeNull();
  });

  it('should handle backend callback failure and display error message', async () => {
    await setup({ code: 'valid-code', state: 'valid-state' });
    authServiceSpy.validateAzureState.and.returnValue(true);
    authServiceSpy.handleAzureCallback.and.returnValue(
      throwError(() => ({ error: { detail: 'Échec de validation du token Azure' } }))
    );

    fixture.detectChanges();

    expect(component.error()).toBe('Échec de validation du token Azure');
    expect(toastServiceSpy.error).toHaveBeenCalledWith('Échec de validation du token Azure');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});

