import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent) },
  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent) },
  { path: 'register', canActivate: [guestGuard], loadComponent: () => import('./pages/register/register.component').then((m) => m.RegisterComponent) },
  {
    path: 'auth/azure/callback',
    loadComponent: () =>
      import('./pages/azure-callback/azure-callback.component').then(
        (m) => m.AzureCallbackComponent
      ),
  },
  {
    path: 'auth/google/callback',
    loadComponent: () =>
      import('./pages/google-callback/google-callback.component').then(
        (m) => m.GoogleCallbackComponent
      ),
  },

  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/dashboard-layout/dashboard-layout.component').then((m) => m.DashboardLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent) },
      { path: 'devices', loadComponent: () => import('./pages/devices/devices.component').then((m) => m.DevicesComponent) },
      { path: 'profile', loadComponent: () => import('./pages/profile/profile.component').then((m) => m.ProfileComponent) },
      { path: 'history', loadComponent: () => import('./pages/history/history.component').then((m) => m.HistoryComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];
