import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
    // Determine provider from route parameter (:provider) or URL path
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

    const params = this.route.snapshot.queryParamMap;
    const errorParam = params.get('error');
    const errorDescription = params.get('error_description');

    // Handle user cancellation explicitly (?error=access_denied)
    if (errorParam === 'access_denied') {
      const msg = `Connexion annulée : vous avez refusé ou annulé l'authentification avec ${this.providerLabel}.`;
      this.error.set(msg);
      this.toast.error(msg);
      this.loading.set(false);
      return;
    }

    // Handle generic OAuth error returned by provider
    if (errorParam) {
      const msg = errorDescription || `Erreur d'authentification ${this.providerLabel} : ${errorParam}`;
      this.error.set(msg);
      this.toast.error(msg);
      this.loading.set(false);
      return;
    }

    const code = params.get('code');
    const state = params.get('state');

    if (!code || !state) {
      const msg = `Paramètres d'autorisation ${this.providerLabel} manquants (code ou state absent).`;
      this.error.set(msg);
      this.toast.error(msg);
      this.loading.set(false);
      return;
    }

    // Validate anti-CSRF state against sessionStorage
    const isValidState = this.auth.validateOAuthState(this.provider, state);
    if (!isValidState) {
      const msg = 'Échec de validation de sécurité (paramètre state invalide ou expiré). Veuillez réessayer.';
      this.error.set(msg);
      this.toast.error(msg);
      this.loading.set(false);
      return;
    }

    // Exchange authorization code & state with backend
    this.auth.handleOAuthCallback(this.provider, code, state).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success(`Connexion avec ${this.providerLabel} réussie !`);
        this.router.navigateByUrl('/dashboard');
      },
      error: (err: any) => {
        this.loading.set(false);
        const detail =
          err?.error?.detail ||
          err?.error?.message ||
          `Impossible de finaliser l'authentification ${this.providerLabel}. Veuillez réessayer.`;
        this.error.set(detail);
        this.toast.error(detail);
      },
    });
  }
}
