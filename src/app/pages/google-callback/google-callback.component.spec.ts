import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { GoogleCallbackComponent } from './google-callback.component';
import { AuthService } from '../../core/services/auth.service';
import { mockUser, MOCK_TOKEN } from '../../../testing/mocks/auth.mock';

describe('GoogleCallbackComponent', () => {
  let fixture: ComponentFixture<GoogleCallbackComponent>;
  let component: GoogleCallbackComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;
  let queryParams: Record<string, string | null>;

  const setup = async (
    params: Record<string, string | null>,
    configureSpy?: (spy: jasmine.SpyObj<AuthService>) => void
  ) => {
    queryParams = params;
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'setToken',
      'handleGoogleCallback',
    ]);
    if (configureSpy) {
      configureSpy(authServiceSpy);
    }

    await TestBed.configureTestingModule({
      imports: [GoogleCallbackComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
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

  it('should set error when error parameter is present in URL', async () => {
    await setup({ error: 'access_denied' });
    fixture.detectChanges();

    expect(component.error()).toBe('access_denied');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should set token and redirect to /dashboard when access_token is present in URL', async () => {
    await setup({ access_token: MOCK_TOKEN });
    fixture.detectChanges();

    expect(authServiceSpy.setToken).toHaveBeenCalledWith(MOCK_TOKEN);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
    expect(component.error()).toBeNull();
  });

  it('should set token and redirect to /dashboard when token parameter is present in URL', async () => {
    await setup({ token: MOCK_TOKEN });
    fixture.detectChanges();

    expect(authServiceSpy.setToken).toHaveBeenCalledWith(MOCK_TOKEN);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
    expect(component.error()).toBeNull();
  });

  it('should exchange code and state and redirect to /dashboard on success', async () => {
    await setup({ code: 'google-auth-code', state: 'google-state' }, (spy) => {
      spy.handleGoogleCallback.and.returnValue(
        of({ access_token: MOCK_TOKEN, user: mockUser })
      );
    });
    fixture.detectChanges();

    expect(authServiceSpy.handleGoogleCallback).toHaveBeenCalledWith('google-auth-code', 'google-state');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
    expect(component.error()).toBeNull();
  });

  it('should set error message when code exchange fails', async () => {
    await setup({ code: 'bad-code', state: 'bad-state' }, (spy) => {
      spy.handleGoogleCallback.and.returnValue(
        throwError(() => new Error('OAuth exchange failed'))
      );
    });
    fixture.detectChanges();

    expect(authServiceSpy.handleGoogleCallback).toHaveBeenCalledWith('bad-code', 'bad-state');
    expect(component.error()).toContain("Impossible de finaliser l'authentification Google");
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should set error message when callback parameters are missing', async () => {
    await setup({});
    fixture.detectChanges();

    expect(component.error()).toBe('Paramètres de callback manquants.');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
