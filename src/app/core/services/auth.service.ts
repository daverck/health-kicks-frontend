import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';


import { environment } from '../../../environments/environment';
import { UserResponse } from '../../models/api.models';

export type OAuthProvider = 'google' | 'azure';

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

  // ----- Unified OAuth2 / SSO flow (Google, Microsoft Entra ID) -----

  /** Request authorization URL & signed anti-CSRF state from backend for given provider. */
  getOAuthLoginUrl(provider: OAuthProvider): Observable<{ authorization_url: string; state: string }> {
    return this.http.get<{ authorization_url: string; state: string }>(
      `${this.base}/auth/${provider}/login`,
      { params: { redirect: 'false' } }
    );
  }

  /**
   * Initiate SSO login:
   * 1. Query backend for signed state and authorization URL
   * 2. Store signed state in sessionStorage
   * 3. Redirect browser to the provider's authorization page
   */
  loginWithOAuth(provider: OAuthProvider) {
    return this.getOAuthLoginUrl(provider).subscribe({
      next: (res) => {
        sessionStorage.setItem(`${provider}_oauth_state`, res.state);
        this.redirectTo(res.authorization_url);
      },
      error: (err) => {
        console.error(`Erreur lors de l'initialisation de la connexion ${provider} :`, err);
      },
    });
  }

  /** Redirect browser to an external URL. */
  redirectTo(url: string): void {
    window.location.href = url;
  }

  /** Validate and consume anti-CSRF state from sessionStorage for given provider. */
  validateOAuthState(provider: OAuthProvider, state: string | null): boolean {
    const key = `${provider}_oauth_state`;
    const savedState = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
    return Boolean(savedState && state && savedState === state);
  }

  /**
   * Exchange an authorization code & state for a HealthKicks session via
   * POST /api/v1/auth/{provider}/callback.
   */
  handleOAuthCallback(provider: OAuthProvider, code: string, state: string) {
    return this.http.post<{ access_token: string; user?: UserResponse }>(
      `${this.base}/auth/${provider}/callback`,
      { code, state }
    ).pipe(tap((res) => this.setSession(res.access_token, res.user ?? null)));
  }

  // --- Provider-specific convenience aliases ---
  getGoogleLoginUrl() { return this.getOAuthLoginUrl('google'); }
  loginWithGoogle() { return this.loginWithOAuth('google'); }
  validateGoogleState(state: string | null) { return this.validateOAuthState('google', state); }
  handleGoogleCallback(code: string, state: string) { return this.handleOAuthCallback('google', code, state); }

  getAzureLoginUrl() { return this.getOAuthLoginUrl('azure'); }
  loginWithMicrosoft() { return this.loginWithOAuth('azure'); }
  validateAzureState(state: string | null) { return this.validateOAuthState('azure', state); }
  handleAzureCallback(code: string, state: string) { return this.handleOAuthCallback('azure', code, state); }


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
