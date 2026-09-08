import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardLayoutComponent } from './dashboard-layout.component';
import { AuthService } from '../../core/services/auth.service';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { UserResponse } from '../../models/api.models';

describe('DashboardLayoutComponent', () => {
  let component: DashboardLayoutComponent;
  let fixture: ComponentFixture<DashboardLayoutComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockUser: UserResponse = {
    id: 1,
    email: 'user@test.com',
    name: 'Jane Doe',
    role: 'user',
    is_active: true,
  };

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['loadMe', 'logout'], {
      user: signal<UserResponse | null>(mockUser),
    });
    authServiceSpy.loadMe.and.returnValue(of(mockUser));

    await TestBed.configureTestingModule({
      imports: [DashboardLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and call loadMe on init', () => {
    expect(component).toBeTruthy();
    expect(authServiceSpy.loadMe).toHaveBeenCalled();
  });

  it('should render sticky desktop sidebar with flex layout and bottom logout button', () => {
    const aside: HTMLElement = fixture.nativeElement.querySelector('aside');
    expect(aside).toBeTruthy();
    expect(aside.classList.contains('md:sticky')).toBeTrue();
    expect(aside.classList.contains('md:top-0')).toBeTrue();
    expect(aside.classList.contains('md:h-screen')).toBeTrue();
    expect(aside.classList.contains('md:flex-col')).toBeTrue();
    expect(aside.classList.contains('md:justify-between')).toBeTrue();

    const logoutBtn: HTMLButtonElement | null = aside.querySelector('button');
    expect(logoutBtn).toBeTruthy();
    expect(logoutBtn?.textContent).toContain('Déconnexion');

    logoutBtn?.click();
    expect(authServiceSpy.logout).toHaveBeenCalled();
  });

  it('should render sticky topbar with user details and mobile hamburger button', () => {
    const header: HTMLElement = fixture.nativeElement.querySelector('header');
    expect(header).toBeTruthy();
    expect(header.classList.contains('sticky')).toBeTrue();
    expect(header.classList.contains('top-0')).toBeTrue();
    expect(header.textContent).toContain('Jane Doe');

    const hamburgerBtn: HTMLButtonElement | null = header.querySelector('[data-testid="mobile-menu-toggle"]');
    expect(hamburgerBtn).toBeTruthy();
    expect(component.isMobileMenuOpen()).toBeFalse();

    hamburgerBtn?.click();
    expect(component.isMobileMenuOpen()).toBeTrue();
  });

  it('should toggle, render drawer and close mobile hamburger menu', () => {
    expect(component.isMobileMenuOpen()).toBeFalse();
    expect(fixture.nativeElement.querySelector('[data-testid="mobile-menu-close"]')).toBeNull();

    component.toggleMobileMenu();
    fixture.detectChanges();

    expect(component.isMobileMenuOpen()).toBeTrue();
    const closeBtn: HTMLButtonElement | null = fixture.nativeElement.querySelector('[data-testid="mobile-menu-close"]');
    expect(closeBtn).toBeTruthy();

    const mobileLinks = fixture.nativeElement.querySelectorAll('aside[role="dialog"] nav a');
    expect(mobileLinks.length).toBe(component.links.length);

    closeBtn?.click();
    fixture.detectChanges();
    expect(component.isMobileMenuOpen()).toBeFalse();
  });

  it('should allow logout from mobile drawer and close menu', () => {
    component.isMobileMenuOpen.set(true);
    fixture.detectChanges();

    const mobileLogoutBtn: HTMLButtonElement | null = fixture.nativeElement.querySelector('[data-testid="mobile-drawer-logout"]');
    expect(mobileLogoutBtn).toBeTruthy();
    expect(mobileLogoutBtn?.textContent).toContain('Déconnexion');

    mobileLogoutBtn?.click();
    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(component.isMobileMenuOpen()).toBeFalse();
  });

  it('should render all dashboard navigation links', () => {
    const links = fixture.nativeElement.querySelectorAll('aside nav a');
    expect(links.length).toBe(component.links.length);
  });

  it('should compute avatar initial correctly', () => {
    expect(component.avatarInitial(mockUser)).toBe('J');
    expect(component.avatarInitial({ ...mockUser, name: undefined, email: 'alex@test.com' })).toBe('A');
    expect(component.avatarInitial({ ...mockUser, name: '', email: '' })).toBe('?');
  });
});
