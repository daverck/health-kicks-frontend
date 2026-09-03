import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../core/services/auth.service';
import { provideRouter } from '@angular/router';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['loginWithGoogle']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component with initial state', () => {
    expect(component).toBeTruthy();
    expect(component.loading()).toBeFalse();
    expect(component.errorMessage()).toBeNull();
  });

  it('should delegate registerWithGoogle to authService.loginWithGoogle and set loading to true', () => {
    component.registerWithGoogle();
    expect(component.loading()).toBeTrue();
    expect(authServiceSpy.loginWithGoogle).toHaveBeenCalled();
  });

  it('should render Google SSO registration button', () => {
    const googleBtn = fixture.nativeElement.querySelector('button.btn-secondary');
    expect(googleBtn).toBeTruthy();
    expect(googleBtn.textContent).toContain("S'inscrire avec Google");
  });

  it('should render error message when errorMessage signal is set', () => {
    component.errorMessage.set('Erreur SSO');
    fixture.detectChanges();

    const errorDiv = fixture.nativeElement.querySelector('.bg-red-50');
    expect(errorDiv).toBeTruthy();
    expect(errorDiv.textContent).toContain('Erreur SSO');
  });
});
