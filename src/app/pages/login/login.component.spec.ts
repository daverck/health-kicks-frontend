import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { mockLoginResponse } from '../../../testing/mocks/auth.mock';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'loginWithGoogle']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
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

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component with invalid initial form state', () => {
    expect(component).toBeTruthy();
    expect(component.form.valid).toBeFalse();
    expect(component.loading()).toBeFalse();
    expect(component.errorMessage()).toBeNull();
    expect(component.returnUrl()).toBe('/history');
  });

  it('should validate email and password inputs correctly', () => {
    const emailControl = component.form.controls.email;
    const passwordControl = component.form.controls.password;

    emailControl.setValue('invalid-email');
    expect(emailControl.valid).toBeFalse();

    emailControl.setValue('valid@healthkicks.local');
    expect(emailControl.valid).toBeTrue();

    passwordControl.setValue('12345');
    expect(passwordControl.valid).toBeFalse(); // minLength(6)

    passwordControl.setValue('123456');
    expect(passwordControl.valid).toBeTrue();
  });

  it('should not call auth.login if form is invalid on submit', () => {
    component.onSubmit();
    expect(authServiceSpy.login).not.toHaveBeenCalled();
    expect(component.form.touched).toBeTrue();
  });

  it('should call auth.login, show toast and navigate on successful submission', () => {
    authServiceSpy.login.and.returnValue(of(mockLoginResponse));

    component.form.setValue({
      email: 'user@healthkicks.local',
      password: 'password123',
    });

    component.onSubmit();

    expect(authServiceSpy.login).toHaveBeenCalledWith('user@healthkicks.local', 'password123');
    expect(toastServiceSpy.success).toHaveBeenCalledWith('Connexion réussie !');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/history');
  });

  it('should set error message and disable loading when login fails', () => {
    authServiceSpy.login.and.returnValue(
      throwError(() => ({ status: 401, error: { detail: 'Identifiants incorrects' } }))
    );

    component.form.setValue({
      email: 'user@healthkicks.local',
      password: 'password123',
    });

    component.onSubmit();

    expect(component.loading()).toBeFalse();
    expect(component.errorMessage()).toBe('Identifiants incorrects');
  });
});

