import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { AuthService, OAuthProvider } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

/**
 * Unified callback component for OAuth2 / SSO identity providers (Google, Microsoft Entra ID).
 * - Extracts provider from route param (:provider) or query params
 * - Validates anti-CSRF state stored in sessionStorage
 * - Handles user cancellation (?error=access_denied) explicitly
 * - Exchanges code & state via POST /api/v1/auth/{provider}/callback
 * - Establishes session and navigates to /dashboard on success
 */
@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './oauth-callback.component.html',
})
export class OAuthCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly error = signal<string | null>(null);
  readonly loading = signal(true);
  provider: OAuthProvider = 'google';
  providerLabel = 'Google';

  ngOnInit(): void {
    this.resolveProvider();

    const params = this.route.snapshot.queryParamMap;
    if (this.handleOAuthParamsError(params)) {
      return;
    }

    const ticket = params.get('ticket');
    const code = params.get('code');
    const state = params.get('state');

    if (ticket) {
      this.handleTicketExchange(ticket, state);
      return;
    }

    if (!code || !state) {
      this.failWithError(`Paramètres d'autorisation ${this.providerLabel} manquants (code ou state absent).`);
      return;
    }

    this.handleCodeExchange(code, state);
  }

  private resolveProvider(): void {
    const routeProvider = (
      this.route.snapshot.paramMap.get('provider') ??
      (this.route.snapshot.routeConfig?.path?.includes('azure') ? 'azure' : 'google')
    ).toLowerCase();

    if (routeProvider === 'azure' || routeProvider === 'microsoft') {
      this.provider = 'azure';
      this.providerLabel = 'Microsoft';
    } else {
      this.provider = 'google';
      this.providerLabel = 'Google';
    }
  }

  private handleOAuthParamsError(params: ParamMap): boolean {
    const errorParam = params.get('error');
    const errorDescription = params.get('error_description');

    if (errorParam === 'access_denied') {
      this.failWithError(
        `Connexion annulée : vous avez refusé ou annulé l'authentification avec ${this.providerLabel}.`
      );
      return true;
    }

    if (errorParam) {
      this.failWithError(
        errorDescription || `Erreur d'authentification ${this.providerLabel} : ${errorParam}`
      );
      return true;
    }

    return false;
  }

  private validateAntiCsrfState(state: string | null): boolean {
    if (!state) {
      return false;
    }
    const isValid = this.auth.validateOAuthState(this.provider, state);
    if (!isValid) {
      this.failWithError(
        'Échec de validation de sécurité (paramètre state invalide ou expiré). Veuillez réessayer.'
      );
      return false;
    }
    return true;
  }

  private handleTicketExchange(ticket: string, state: string | null): void {
    if (state && !this.validateAntiCsrfState(state)) {
      return;
    }

    const verifier = this.auth.consumePkceVerifier ? this.auth.consumePkceVerifier(this.provider) : null;
    this.auth.exchangeOAuthTicket(ticket, verifier).subscribe({
      next: () => this.onAuthSuccess(),
      error: (err: any) => this.onAuthError(err),
    });
  }

  private handleCodeExchange(code: string, state: string): void {
    if (!this.validateAntiCsrfState(state)) {
      return;
    }

    this.auth.handleOAuthCallback(this.provider, code, state).subscribe({
      next: () => this.onAuthSuccess(),
      error: (err: any) => this.onAuthError(err),
    });
  }

  private onAuthSuccess(): void {
    this.loading.set(false);
    this.toast.success(`Connexion avec ${this.providerLabel} réussie !`);
    this.router.navigateByUrl('/dashboard/devices');
  }

  private onAuthError(err: any): void {
    this.loading.set(false);
    const detail =
      err?.error?.detail ||
      err?.error?.message ||
      `Impossible de finaliser l'authentification ${this.providerLabel}. Veuillez réessayer.`;
    this.error.set(detail);
    this.toast.error(detail);
  }

  private failWithError(message: string): void {
    this.error.set(message);
    this.toast.error(message);
    this.loading.set(false);
  }
}
