import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { UserResponse } from '../../models/api.models';
import { AuthService } from '../../core/services/auth.service';

import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

export type NavIconId =
  | 'steps'
  | 'vibrations'
  | 'devices'
  | 'history'
  | 'fall-alerts'
  | 'studio'
  | 'studio-history'
  | 'studio-classes'
  | 'logout';

export interface NavLink {
  path: string;
  labelKey: string;
  label: string;
  icon: NavIconId;
  exact: boolean;
  clinicianOnly: boolean;
}

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    LanguageSelectorComponent,
    ThemeToggleComponent,
  ],
  templateUrl: './dashboard-layout.component.html',
})
export class DashboardLayoutComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly isMobileMenuOpen = signal(false);

  readonly links: NavLink[] = [
    { path: '/dashboard/steps', labelKey: 'nav.steps', label: 'Podomètre & Pas', icon: 'steps', exact: true, clinicianOnly: false },
    { path: '/dashboard/vibrations', labelKey: 'nav.vibrations', label: 'Vibrations manuelles', icon: 'vibrations', exact: true, clinicianOnly: false },
    { path: '/dashboard/devices', labelKey: 'nav.devices', label: 'Mes Équipements', icon: 'devices', exact: true, clinicianOnly: false },
    { path: '/dashboard/history', labelKey: 'nav.history', label: 'Historique', icon: 'history', exact: true, clinicianOnly: false },
    { path: '/dashboard/fall-alerts', labelKey: 'nav.fall_alerts', label: 'Alertes de chute', icon: 'fall-alerts', exact: true, clinicianOnly: false },
    { path: '/dashboard/studio', labelKey: 'nav.studio', label: 'Studio Capture', icon: 'studio', exact: true, clinicianOnly: true },
    { path: '/dashboard/studio/history', labelKey: 'nav.studio_history', label: 'Historique Studio', icon: 'studio-history', exact: false, clinicianOnly: true },
    { path: '/dashboard/studio/classes', labelKey: 'nav.studio_classes', label: 'Classes Studio', icon: 'studio-classes', exact: true, clinicianOnly: true },
  ];

  readonly isClinicianOrAdmin = computed(() => {
    const role = (this.auth.currentUser ? this.auth.currentUser() : this.auth.user())?.role;
    return role === 'admin' || role === 'clinician';
  });

  /**
   * Hides menu entries restricted to `clinician` and `admin` roles
   * (Studio Capture and Studio History) for standard users (`user`).
   */
  readonly visibleLinks = computed(() =>
    this.links.filter((l) => !l.clinicianOnly || this.isClinicianOrAdmin())
  );

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.closeMobileMenu();
      });
  }

  ngOnInit(): void {
    // Load / refresh the user profile on layout init.
    this.auth.loadMe().subscribe({ error: () => {} });
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  avatarInitial(user: UserResponse): string {
    const source = user.name || user.email;
    return source ? source[0]!.toUpperCase() : '?';
  }

  logout(): void {
    this.closeMobileMenu();
    this.auth.logout();
  }
}
