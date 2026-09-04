import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';
import { ActivatedRoute, provideRouter } from '@angular/router';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['loginWithGoogle', 'loginWithMicrosoft']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'returnUrl' ? '/history' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component with initial state', () => {
    expect(component).toBeTruthy();
    expect(component.loading()).toBeFalse();
    expect(component.errorMessage()).toBeNull();
    expect(component.returnUrl()).toBe('/history');
  });

  it('should delegate loginWithGoogle to authService.loginWithGoogle and set loading to true', () => {
    component.loginWithGoogle();
    expect(component.loading()).toBeTrue();
    expect(component.loadingGoogle()).toBeTrue();
    expect(authServiceSpy.loginWithGoogle).toHaveBeenCalled();
  });

  it('should delegate loginWithMicrosoft to authService.loginWithMicrosoft and set loading to true', () => {
    component.loginWithMicrosoft();
    expect(component.loading()).toBeTrue();
    expect(component.loadingMicrosoft()).toBeTrue();
    expect(authServiceSpy.loginWithMicrosoft).toHaveBeenCalled();
  });

  it('should render Google SSO button', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button.btn-secondary');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toContain('Continuer avec Google');
  });


  it('should render Microsoft SSO button with correct branding label', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button.btn-secondary');
    expect(buttons.length).toBe(2);
    expect(buttons[1].textContent).toContain('Se connecter avec Microsoft');
  });

  it('should render error message when errorMessage signal is set', () => {
    component.errorMessage.set('Erreur de connexion OAuth');
    fixture.detectChanges();

    const errorDiv = fixture.nativeElement.querySelector('.bg-red-50');
    expect(errorDiv).toBeTruthy();
    expect(errorDiv.textContent).toContain('Erreur de connexion OAuth');
  });

});

