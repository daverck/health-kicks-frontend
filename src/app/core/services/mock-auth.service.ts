import { Injectable } from '@angular/core';
import { Observable, Subscription, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenResponse, UserResponse } from '../../models/api.models';
import { AuthService, OAuthProvider } from './auth.service';

/**
 * Service d'authentification mocké pour le développement local et les tests.
 * Permet de naviguer directement dans le Dashboard et le Studio sans dépendre d'un serveur SSO/Keycloak.
 */
@Injectable()
export class MockAuthService extends AuthService {
  private readonly mockUser: UserResponse = {
    id: environment.mockUser?.id ?? 1,
    email: environment.mockUser?.email ?? 'serckdavid@gmail.com',
    name: environment.mockUser?.name ?? 'David Serck',
    role: environment.mockUser?.role ?? 'admin',
    is_active: true,
    avatar_url: null,
  };

  private readonly mockToken: string = environment.mockUser?.token ?? 'mock-dev-jwt-token';

  private get mockTokenResponse(): TokenResponse {
    return {
      access_token: this.mockToken,
      refresh_token: 'mock-dev-refresh-token',
      token_type: 'bearer',
      user: this.mockUser,
    };
  }

  constructor() {
    super();
    // Initialise immédiatement la session avec l'utilisateur et le token mockés
    this.userSignal.set(this.mockUser);
    this.tokenSignal.set(this.mockToken);
    this.setSession(this.mockToken, this.mockUser);
  }

  override getAccessToken(): string | null {
    return this.mockToken;
  }

  override getToken(): string | null {
    return this.mockToken;
  }

  override getRefreshToken(): string | null {
    return 'mock-dev-refresh-token';
  }

  override loadMe(): Observable<UserResponse> {
    this.userSignal.set(this.mockUser);
    return of(this.mockUser);
  }

  override login(_email: string, _password: string): Observable<TokenResponse> {
    this.setSession(this.mockTokenResponse);
    return of(this.mockTokenResponse);
  }

  override register(_payload: { email: string; password: string; name?: string }): Observable<TokenResponse> {
    this.setSession(this.mockTokenResponse);
    return of(this.mockTokenResponse);
  }

  override refreshToken(): Observable<TokenResponse> {
    this.setSession(this.mockTokenResponse);
    return of(this.mockTokenResponse);
  }

  override loginWithOAuth(_provider: OAuthProvider): Subscription {
    this.setSession(this.mockTokenResponse);
    this.router.navigate(['/dashboard']);
    return new Subscription();
  }

  override handleOAuthCallback(_provider: OAuthProvider, _code: string, _state: string): Observable<TokenResponse> {
    this.setSession(this.mockTokenResponse);
    return of(this.mockTokenResponse);
  }

  override logout(redirectTo = '/'): void {
    // Réinitialise la session mais la réarme immédiatement avec les mocks
    super.clearSession();
    this.setSession(this.mockToken, this.mockUser);
    this.router.navigate([redirectTo]);
  }
}
