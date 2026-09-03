import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { UserResponse } from '../../models/api.models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard-layout.component.html',
})
export class DashboardLayoutComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly links = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/dashboard/devices', label: 'Mes Équipements', icon: '👟' },
    { path: '/dashboard/history', label: 'Historique', icon: '🕓' },
    { path: '/dashboard/profile', label: 'Mon profil', icon: '👤' },
  ];

  ngOnInit(): void {
    // Load / refresh the user profile on layout init.
    this.auth.loadMe().subscribe({ error: () => {} });
  }

  avatarInitial(user: UserResponse): string {
    const source = user.name || user.email;
    return source ? source[0]!.toUpperCase() : '?';
  }

  logout(): void {
    this.auth.logout();
  }
}
