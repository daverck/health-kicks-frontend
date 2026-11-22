import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ProfileComponent } from './profile.component';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { UserResponse } from '../../models/api.models';
import { mockUser } from '../../../testing/mocks/auth.mock';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['loadMe', 'logout'], {
      user: signal<UserResponse | null>(mockUser),
    });
    authServiceSpy.loadMe.and.returnValue(of(mockUser));

    userServiceSpy = jasmine.createSpyObj('UserService', ['updateProfile', 'deleteAccount']);
    userServiceSpy.updateProfile.and.returnValue(of({ ...mockUser, name: 'Marie Dupont' }));
    userServiceSpy.deleteAccount.and.returnValue(of(undefined as unknown as void));

    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
  });

  it('should create and populate form from user on init', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(authServiceSpy.loadMe).toHaveBeenCalled();
    expect(component.form.controls.name.value).toBe(mockUser.name ?? '');
    expect(component.form.controls.email.value).toBe(mockUser.email);
    expect(component.loading()).toBeFalse();
  });

  it('should instantiate email form control with disabled status', () => {
    fixture.detectChanges();

    expect(component.form.controls.email.disabled).toBeTrue();
    expect(component.form.controls.email.enabled).toBeFalse();
  });

  it('should render email input as readonly with disabled styling, lock icon and OIDC message', () => {
    fixture.detectChanges();

    const emailInput: HTMLInputElement = fixture.nativeElement.querySelector('#email');
    expect(emailInput).toBeTruthy();
    expect(emailInput.readOnly).toBeTrue();
    expect(emailInput.classList.contains('cursor-not-allowed')).toBeTrue();
    expect(emailInput.classList.contains('bg-gray-100')).toBeTrue();
    expect(emailInput.value).toBe(mockUser.email);

    // Lock icon and OIDC help message
    const cardText = fixture.nativeElement.textContent;
    expect(cardText).toContain('Lecture seule');
    expect(cardText).toContain('SSO / OpenID');
  });

  it('should exclude email from updateProfile payload upon submission', () => {
    fixture.detectChanges();

    component.form.controls.name.setValue('Nouveau Nom');
    component.save();

    expect(userServiceSpy.updateProfile).toHaveBeenCalled();
    const [calledUserUuid, payload] = userServiceSpy.updateProfile.calls.mostRecent().args;

    expect(calledUserUuid).toBe(mockUser.uuid);
    expect(payload).toEqual({ name: 'Nouveau Nom' });
    expect('email' in payload).toBeFalse();
    expect(toastServiceSpy.success).toHaveBeenCalledWith('Profil mis à jour !');
  });

  it('should handle update profile error and display error message', () => {
    userServiceSpy.updateProfile.and.returnValue(
      throwError(() => ({ status: 400, error: { detail: 'Nom invalide' } }))
    );

    fixture.detectChanges();
    component.form.controls.name.setValue('Erreur');
    component.save();

    expect(component.saving()).toBeFalse();
    expect(component.errorMessage()).toBe('Nom invalide');
  });

  it('should compute user initials correctly', () => {
    expect(component.initials(mockUser)).toBe('TH');
    expect(component.initials({ ...mockUser, name: 'Jean-Claude Van Damme' })).toBe('JV');
    expect(component.initials({ ...mockUser, name: undefined, email: 'alice.smith@example.com' })).toBe('AS');
  });

  it('should display user role in badge and definition list field', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const roleBadge = compiled.querySelector('#profile-role-badge');
    expect(roleBadge).toBeTruthy();
    expect(roleBadge?.textContent).toContain('Rôle');
    expect(roleBadge?.textContent).toContain('Utilisateur');

    const roleField = compiled.querySelector('#profile-role-field');
    expect(roleField).toBeTruthy();
    expect(roleField?.textContent?.trim()).toBe('Utilisateur');
  });

  it('should map role labels and styling classes correctly', () => {
    expect(component.roleLabel('admin')).toBe('Administrateur');
    expect(component.roleLabel('trainer')).toBe('Entraîneur ML');
    expect(component.roleLabel('clinician')).toBe('Praticien');
    expect(component.roleLabel('user')).toBe('Utilisateur');
    expect(component.roleLabel('')).toBe('');

    expect(component.roleBadgeClass('admin')).toContain('bg-purple-100');
    expect(component.roleBadgeClass('trainer')).toContain('bg-blue-100');
    expect(component.roleBadgeClass('clinician')).toContain('bg-blue-100');
    expect(component.roleBadgeClass('user')).toContain('bg-primary-50');
  });

  // --- Danger Zone: Account Deletion Tests ---

  it('should open delete account confirmation modal when clicking delete button', () => {
    fixture.detectChanges();

    const openBtn: HTMLButtonElement = fixture.nativeElement.querySelector('#open-delete-modal-btn');
    expect(openBtn).toBeTruthy();
    openBtn.click();
    fixture.detectChanges();

    expect(component.showDeleteModal()).toBeTrue();
    const modal = fixture.nativeElement.querySelector('#delete-account-modal');
    expect(modal).toBeTruthy();
  });

  it('should close delete account confirmation modal when clicking cancel', () => {
    fixture.detectChanges();

    component.openDeleteModal();
    fixture.detectChanges();

    const cancelBtn: HTMLButtonElement = fixture.nativeElement.querySelector('#cancel-delete-btn');
    expect(cancelBtn).toBeTruthy();
    cancelBtn.click();
    fixture.detectChanges();

    expect(component.showDeleteModal()).toBeFalse();
    const modal = fixture.nativeElement.querySelector('#delete-account-modal');
    expect(modal).toBeFalsy();
  });

  it('should call deleteAccount, logout, show success toast, and navigate to /login upon confirmation', () => {
    fixture.detectChanges();

    component.openDeleteModal();
    fixture.detectChanges();

    const confirmBtn: HTMLButtonElement = fixture.nativeElement.querySelector('#confirm-delete-btn');
    expect(confirmBtn).toBeTruthy();
    confirmBtn.click();
    fixture.detectChanges();

    expect(userServiceSpy.deleteAccount).toHaveBeenCalled();
    expect(toastServiceSpy.success).toHaveBeenCalledWith('Votre compte a été supprimé avec succès.');
    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    expect(component.showDeleteModal()).toBeFalse();
    expect(component.deleting()).toBeFalse();
  });

  it('should handle deleteAccount error gracefully and display error message', () => {
    userServiceSpy.deleteAccount.and.returnValue(
      throwError(() => ({ status: 500, error: { detail: 'Erreur serveur interne' } }))
    );

    fixture.detectChanges();
    component.openDeleteModal();
    fixture.detectChanges();

    const confirmBtn: HTMLButtonElement = fixture.nativeElement.querySelector('#confirm-delete-btn');
    confirmBtn.click();
    fixture.detectChanges();

    expect(userServiceSpy.deleteAccount).toHaveBeenCalled();
    expect(component.deleting()).toBeFalse();
    expect(component.deleteErrorMessage()).toBe('Erreur serveur interne');
    expect(toastServiceSpy.error).toHaveBeenCalledWith('Erreur serveur interne');
    expect(authServiceSpy.logout).not.toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();

    const errorBanner = fixture.nativeElement.querySelector('#delete-error-banner');
    expect(errorBanner).toBeTruthy();
    expect(errorBanner.textContent).toContain('Erreur serveur interne');
  });
});
