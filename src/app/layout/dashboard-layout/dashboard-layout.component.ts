import { Component, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { UserResponse } from '../../models/api.models';
import { AuthService } from '../../core/services/auth.service';

import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    LanguageSelectorComponent,
  ],
  templateUrl: './dashboard-layout.component.html',
})
export class DashboardLayoutComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly isMobileMenuOpen = signal(false);

  readonly links = [
    { path: '/dashboard/vibrations', labelKey: 'nav.vibrations', label: 'Vibrations manuelles', icon: '📳' },
    { path: '/dashboard/devices', labelKey: 'nav.devices', label: 'Mes Équipements', icon: '👟' },
    { path: '/dashboard/history', labelKey: 'nav.history', label: 'Historique', icon: '🕓' },
    { path: '/dashboard/studio', labelKey: 'nav.studio', label: 'Studio Capture', icon: '🎬' },
    { path: '/dashboard/studio/history', labelKey: 'nav.studio_history', label: 'Historique Studio', icon: '📊' },
    { path: '/dashboard/profile', labelKey: 'nav.profile', label: 'Mon profil', icon: '👤' },
  ];

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
