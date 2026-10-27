import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { TokenResponse, UserResponse } from '../../models/api.models';

export type OAuthProvider = 'google' | 'azure';

export const ACCESS_TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const USER_KEY = 'hk_user';

const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function rotr(n: number, x: number): number {
  return (x >>> n) | (x << (32 - n));
}

export function computePkceChallengeSync(verifier: string): string {
  const bytes = new TextEncoder().encode(verifier);
  const bitLen = bytes.length * 8;
  const totalBytes = (((bytes.length + 9 + 63) >> 6) << 6);
  const padded = new Uint8Array(totalBytes);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(totalBytes - 4, bitLen >>> 0, false);
  view.setUint32(totalBytes - 8, Math.floor(bitLen / 0x100000000), false);

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const w = new Uint32Array(64);

  for (let offset = 0; offset < totalBytes; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(7, w[i - 15]) ^ rotr(18, w[i - 15]) ^ (w[i - 15] >>> 3);
      const s1 = rotr(17, w[i - 2]) ^ rotr(19, w[i - 2]) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + SHA256_K[i] + w[i]) >>> 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g; g = f; f = e; e = (d + temp1) >>> 0;
      d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }

  const digest = new Uint8Array(32);
  const digestView = new DataView(digest.buffer);
  [h0, h1, h2, h3, h4, h5, h6, h7].forEach((val, idx) => digestView.setUint32(idx * 4, val, false));

  let binary = '';
  for (let i = 0; i < digest.length; i++) {
    binary += String.fromCharCode(digest[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  protected readonly router = inject(Router);

  protected readonly userSignal = signal<UserResponse | null>(this.getStoredUser());
  protected readonly tokenSignal = signal<string | null>(
    localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem('hk_access_token')
  );

  readonly user = this.userSignal.asReadonly();
  readonly currentUser = this.user;
  readonly token = this.tokenSignal.asReadonly();
  readonly isAuthenticated = computed(() => {
    const t = this.tokenSignal();
    return typeof t === 'string' && t.trim().length > 0;
  });

  private readonly base = `${environment.apiUrl}/api/v1`;
  private readonly pkceKeyPrefix = 'hk_oauth_pkce_';

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

  /** Generate and store a 64-character URL-safe PKCE code_verifier in sessionStorage. */
  generatePkceVerifier(provider: OAuthProvider): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const randomValues = new Uint8Array(64);
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      crypto.getRandomValues(randomValues);
    } else {
      for (let i = 0; i < 64; i++) {
        randomValues[i] = Math.floor(Math.random() * 256);
      }
    }
    let verifier = '';
    for (let i = 0; i < 64; i++) {
      verifier += charset[randomValues[i] % charset.length];
    }
    sessionStorage.setItem(`${this.pkceKeyPrefix}${provider}`, verifier);
    return verifier;
  }

  /** Read and remove the PKCE code_verifier from sessionStorage for the given provider. */
  consumePkceVerifier(provider: OAuthProvider): string | null {
    const key = `${this.pkceKeyPrefix}${provider}`;
    const verifier = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
    return verifier;
  }

  /** Compute RFC 7636 S256 base64url code_challenge without '=' padding. */
  computePkceChallenge(verifier: string): string {
    return computePkceChallengeSync(verifier);
  }

  /** Request authorization URL & signed anti-CSRF state from backend for given provider. */
  getOAuthLoginUrl(provider: OAuthProvider, codeChallenge?: string): Observable<{ authorization_url: string; state: string }> {
    const params: Record<string, string> = { redirect: 'false' };
    if (codeChallenge) {
      params['code_challenge'] = codeChallenge;
      params['code_challenge_method'] = 'S256';
    }
    return this.http.get<{ authorization_url: string; state: string }>(
      `${this.base}/auth/${provider}/login`,
      { params }
    );
  }

  /**
   * Initiate SSO login:
   * 1. Generate PKCE verifier & S256 challenge
   * 2. Query backend for signed state and authorization URL
   * 3. Store signed state in sessionStorage
   * 4. Redirect browser to the provider's authorization page
   */
  loginWithOAuth(provider: OAuthProvider) {
    const verifier = this.generatePkceVerifier(provider);
    const challenge = this.computePkceChallenge(verifier);
    return this.getOAuthLoginUrl(provider, challenge).subscribe({
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
   * Exchange an authorization code & state (plus optional PKCE code_verifier) for a HealthKicks session via
   * POST /api/v1/auth/{provider}/callback.
   */
  handleOAuthCallback(
    provider: OAuthProvider,
    code: string,
    state: string,
    codeVerifier?: string | null
  ): Observable<TokenResponse> {
    const verifier = codeVerifier ?? this.consumePkceVerifier(provider);
    return this.http.post<TokenResponse>(
      `${this.base}/auth/${provider}/callback`,
      { code, state, ...(verifier ? { code_verifier: verifier } : {}) }
    ).pipe(tap((res) => this.setSession(res)));
  }

  /**
   * Exchange a one-time OAuth authorization ticket (and optional PKCE code_verifier) for a HealthKicks session via
   * POST /api/v1/auth/token/exchange.
   */
  exchangeOAuthTicket(ticket: string, codeVerifier?: string | null): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(
      `${this.base}/auth/token/exchange`,
      { ticket, ...(codeVerifier ? { code_verifier: codeVerifier } : {}) }
    ).pipe(tap((res) => this.setSession(res)));
  }

  // --- Provider-specific convenience aliases ---
  getGoogleLoginUrl(codeChallenge?: string) { return this.getOAuthLoginUrl('google', codeChallenge); }
  loginWithGoogle() { return this.loginWithOAuth('google'); }
  validateGoogleState(state: string | null) { return this.validateOAuthState('google', state); }
  handleGoogleCallback(code: string, state: string, codeVerifier?: string | null) {
    return this.handleOAuthCallback('google', code, state, codeVerifier);
  }

  getAzureLoginUrl(codeChallenge?: string) { return this.getOAuthLoginUrl('azure', codeChallenge); }
  loginWithMicrosoft() { return this.loginWithOAuth('azure'); }
  validateAzureState(state: string | null) { return this.validateOAuthState('azure', state); }
  handleAzureCallback(code: string, state: string, codeVerifier?: string | null) {
    return this.handleOAuthCallback('azure', code, state, codeVerifier);
  }

  getStoredUser(): UserResponse | null {
    const tokenUser = this.getUserFromToken();
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Security check: verify that stored user role matches cryptographically signed JWT claim
        if (tokenUser && tokenUser.role && parsed && parsed.role && parsed.role !== tokenUser.role) {
          console.warn('[Security] Discrepancy between stored role and token claim. Discarding tampered user object.');
          return tokenUser;
        }
        return parsed;
      }
    } catch {
      // Ignore JSON parse error
    }
    return tokenUser;
  }

  getUserFromToken(): UserResponse | null {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem('hk_access_token');
      if (!token) return null;
      const parts = token.split('.');
      if (parts.length < 2) return null;
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4 !== 0) {
        base64 += '=';
      }
      const jsonStr = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonStr);
      if (payload && payload.role && payload.sub) {
        return {
          uuid: String(payload.sub),
          pseudonym: payload.pseudonym || '',
          email: payload.email || '',
          name: payload.name || null,
          role: payload.role,
          is_active: true,
        };
      }
    } catch {
      // Ignore token parse error
    }
    return null;
  }

  /** Fetch the current user profile (GET /auth/me). */
  loadMe(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.base}/auth/me`).pipe(
      tap((user) => {
        this.userSignal.set(user);
        try {
          localStorage.setItem(USER_KEY, JSON.stringify(user));
        } catch (_) {}
      })
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
        if (user) {
          try {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
          } catch (_) {}
        } else {
          localStorage.removeItem(USER_KEY);
        }
      } else {
        const u = this.getUserFromToken();
        if (u) {
          this.userSignal.set(u);
          try {
            localStorage.setItem(USER_KEY, JSON.stringify(u));
          } catch (_) {}
        }
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
        try {
          localStorage.setItem(USER_KEY, JSON.stringify(u));
        } catch (_) {}
      } else {
        const tokenUser = this.getUserFromToken();
        if (tokenUser) {
          this.userSignal.set(tokenUser);
          try {
            localStorage.setItem(USER_KEY, JSON.stringify(tokenUser));
          } catch (_) {}
        }
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
    localStorage.removeItem(USER_KEY);
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
