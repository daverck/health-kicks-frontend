import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserResponse } from '../../models/api.models';

const TOKEN_KEY = 'hk_access_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly userSignal = signal<UserResponse | null>(null);
  private readonly tokenSignal = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly user = this.userSignal.asReadonly();
  readonly token = this.tokenSignal.asReadonly();
  readonly isAuthenticated = computed(() => {
    const t = this.tokenSignal();
    return typeof t === 'string' && t.trim().length > 0;
  });

  private readonly base = `${environment.apiUrl}/api/v1`;

  // ----- Standard email/password auth -----
  // NOTE: if the backend exposes /auth/login, wire it here; otherwise keep
  // this method as the single place to adapt when the endpoint ships.
  login(email: string, password: string) {
    return this.http.post<{ access_token: string; user?: UserResponse }>(
      `${this.base}/auth/login`,
      { email, password }
    ).pipe(tap((res) => this.setSession(res.access_token, res.user ?? null)));
  }

  register(payload: { email: string; password: string; name?: string }) {
    return this.http.post<{ access_token: string; user?: UserResponse }>(
      `${this.base}/auth/register`,
      payload
    ).pipe(tap((res) => this.setSession(res.access_token, res.user ?? null)));
  }

  // ----- Google SSO (OAuth2 authorization code flow, backend-driven) -----
  /** Redirect the browser to the backend Google OAuth2 entry point. */
  loginWithGoogle(): void {
    window.location.href = `${this.base}/auth/google/login`;
  }

  /**
   * Exchange an authorization `code` (received on the redirect URL) for a
   * session via the backend callback endpoint.
   */
  handleGoogleCallback(code: string, state: string) {
    return this.http.get<{ access_token: string; user?: UserResponse }>(
      `${this.base}/auth/google/callback`,
      { params: { code, state } }
    ).pipe(tap((res) => this.setSession(res.access_token, res.user ?? null)));
  }

  /** Fetch the current user profile (GET /auth/me). */
  loadMe() {
    return this.http.get<UserResponse>(`${this.base}/auth/me`).pipe(
      tap((user) => this.userSignal.set(user))
    );
  }

  setSession(token: string, user: UserResponse | null): void {
    localStorage.setItem(TOKEN_KEY, token);
    this.tokenSignal.set(token);
    if (user) this.userSignal.set(user);
  }

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this.tokenSignal.set(token);
  }

  logout(redirectTo = '/login'): void {
    localStorage.removeItem(TOKEN_KEY);
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    this.router.navigate([redirectTo]);
  }
}
