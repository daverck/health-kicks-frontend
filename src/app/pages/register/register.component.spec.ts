import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { mockLoginResponse } from '../../../testing/mocks/auth.mock';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['register', 'loginWithGoogle']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component with invalid initial form state', () => {
    expect(component).toBeTruthy();
    expect(component.form.valid).toBeFalse();
    expect(component.loading()).toBeFalse();
    expect(component.errorMessage()).toBeNull();
  });

  it('should validate email and password inputs correctly', () => {
    const emailControl = component.form.controls.email;
    const passwordControl = component.form.controls.password;
    const confirmControl = component.form.controls.confirmPassword;

    emailControl.setValue('invalid-email');
    expect(emailControl.valid).toBeFalse();

    emailControl.setValue('valid@healthkicks.local');
    expect(emailControl.valid).toBeTrue();

    passwordControl.setValue('123');
    expect(passwordControl.valid).toBeFalse();

    passwordControl.setValue('secret123');
    expect(passwordControl.valid).toBeTrue();

    confirmControl.setValue('');
    expect(confirmControl.valid).toBeFalse();
  });

  it('should detect password mismatch between password and confirmPassword', () => {
    component.form.controls.password.setValue('password123');
    component.form.controls.confirmPassword.setValue('different123');

    expect(component.form.hasError('passwordMismatch')).toBeTrue();
    expect(component.form.valid).toBeFalse();

    component.form.controls.confirmPassword.setValue('password123');
    expect(component.form.hasError('passwordMismatch')).toBeFalse();
  });

  it('should not call authService.register when form is invalid', () => {
    component.onSubmit();
    expect(authServiceSpy.register).not.toHaveBeenCalled();
    expect(component.form.touched).toBeTrue();
  });

  it('should call authService.register and navigate on success', () => {
    authServiceSpy.register.and.returnValue(of(mockLoginResponse));

    component.form.setValue({
      name: 'Alice',
      email: 'alice@healthkicks.local',
      password: 'secretpassword',
      confirmPassword: 'secretpassword',
    });

    component.onSubmit();

    expect(authServiceSpy.register).toHaveBeenCalledWith({
      name: 'Alice',
      email: 'alice@healthkicks.local',
      password: 'secretpassword',
    });
    expect(toastServiceSpy.success).toHaveBeenCalledWith('Compte créé avec succès !');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('should handle backend error and display detail or fallback', () => {
    authServiceSpy.register.and.returnValue(
      throwError(() => ({ status: 400, error: { detail: 'Cet email est déjà utilisé' } }))
    );

    component.form.setValue({
      name: 'Alice',
      email: 'alice@healthkicks.local',
      password: 'secretpassword',
      confirmPassword: 'secretpassword',
    });

    component.onSubmit();

    expect(component.loading()).toBeFalse();
    expect(component.errorMessage()).toBe('Cet email est déjà utilisé');
  });

  it('should handle network error (status 0)', () => {
    authServiceSpy.register.and.returnValue(
      throwError(() => ({ status: 0 }))
    );

    component.form.setValue({
      name: 'Alice',
      email: 'alice@healthkicks.local',
      password: 'secretpassword',
      confirmPassword: 'secretpassword',
    });

    component.onSubmit();

    expect(component.loading()).toBeFalse();
    expect(component.errorMessage()).toContain('Backend injoignable');
  });

  it('should delegate registerWithGoogle to authService.loginWithGoogle', () => {
    component.registerWithGoogle();
    expect(authServiceSpy.loginWithGoogle).toHaveBeenCalled();
  });
});
