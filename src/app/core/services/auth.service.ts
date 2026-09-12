import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { TokenResponse, UserResponse } from '../../models/api.models';

export type OAuthProvider = 'google' | 'azure';

export const ACCESS_TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly userSignal = signal<UserResponse | null>(null);
  private readonly tokenSignal = signal<string | null>(
    localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem('hk_access_token')
  );

  readonly user = this.userSignal.asReadonly();
  readonly token = this.tokenSignal.asReadonly();
  readonly isAuthenticated = computed(() => {
    const t = this.tokenSignal();
    return typeof t === 'string' && t.trim().length > 0;
  });

  private readonly base = `${environment.apiUrl}/api/v1`;

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem('hk_access_token');
  }

  getToken(): string | null {
    return this.getAccessToken();
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  // ----- Standard email/password auth -----
  login(email: string, password: string): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(
      `${this.base}/auth/login`,
      { email, password }
    ).pipe(tap((res) => this.setSession(res)));
  }

  register(payload: { email: string; password: string; name?: string }): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(
      `${this.base}/auth/register`,
      payload
    ).pipe(tap((res) => this.setSession(res)));
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
  handleOAuthCallback(provider: OAuthProvider, code: string, state: string): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(
      `${this.base}/auth/${provider}/callback`,
      { code, state }
    ).pipe(tap((res) => this.setSession(res)));
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
  loadMe(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.base}/auth/me`).pipe(
      tap((user) => this.userSignal.set(user))
    );
  }

  /**
   * Adapte la session utilisateur avec soit un TokenResponse, soit un access_token + user.
   * Stocke l'access_token et le refresh_token (si présent) dans le localStorage.
   */
  setSession(tokenResponse: TokenResponse): void;
  setSession(accessToken: string, user?: UserResponse | null): void;
  setSession(tokenOrResponse: string | TokenResponse, user?: UserResponse | null): void {
    if (typeof tokenOrResponse === 'string') {
      localStorage.setItem(ACCESS_TOKEN_KEY, tokenOrResponse);
      localStorage.setItem('hk_access_token', tokenOrResponse);
      this.tokenSignal.set(tokenOrResponse);
      if (user !== undefined) {
        this.userSignal.set(user);
      }
    } else {
      const { access_token, refresh_token, user: u } = tokenOrResponse;
      localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
      localStorage.setItem('hk_access_token', access_token);
      this.tokenSignal.set(access_token);
      if (refresh_token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
      }
      if (u !== undefined && u !== null) {
        this.userSignal.set(u);
      }
    }
  }

  setToken(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    localStorage.setItem('hk_access_token', token);
    this.tokenSignal.set(token);
  }

  clearSession(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem('hk_access_token');
    this.tokenSignal.set(null);
    this.userSignal.set(null);
  }

  logout(redirectTo = '/'): void {
    this.clearSession();
    this.router.navigate([redirectTo]);
  }

  /**
   * Renouvelle la session utilisateur via POST /api/v1/auth/refresh avec rotation du refresh token.
   */
  refreshToken(): Observable<TokenResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }
    return this.http.post<TokenResponse>(`${this.base}/auth/refresh`, {
      refresh_token: refreshToken,
    }).pipe(
      tap((res) => {
        this.setSession(res);
      })
    );
  }
}
