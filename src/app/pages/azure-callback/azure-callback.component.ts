import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

/**
 * Handles the redirect back from Microsoft Entra ID:
 * - Validates anti-CSRF state stored in sessionStorage
 * - Handles cancellation (error=access_denied) explicitly
 * - Calls POST /api/v1/auth/azure/callback
 * - Redirects to /dashboard on success or displays explicit error
 */
@Component({
  selector: 'app-azure-callback',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './azure-callback.component.html',
})
export class AzureCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly error = signal<string | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const errorParam = params.get('error');
    const errorDescription = params.get('error_description');

    // Handle user cancellation explicitly (?error=access_denied)
    if (errorParam === 'access_denied') {
      const msg = "Connexion annulée : vous avez refusé ou annulé l'authentification avec Microsoft.";
      this.error.set(msg);
      this.toast.error(msg);
      this.loading.set(false);
      return;
    }

    // Handle other OAuth errors returned by Microsoft
    if (errorParam) {
      const msg = errorDescription || `Erreur d'authentification Microsoft : ${errorParam}`;
      this.error.set(msg);
      this.toast.error(msg);
      this.loading.set(false);
      return;
    }

    const code = params.get('code');
    const state = params.get('state');

    if (!code || !state) {
      const msg = "Paramètres d'autorisation Microsoft manquants (code ou state absent).";
      this.error.set(msg);
      this.toast.error(msg);
      this.loading.set(false);
      return;
    }

    // Validate anti-CSRF state against sessionStorage
    const isValidState = this.auth.validateAzureState(state);
    if (!isValidState) {
      const msg = "Échec de validation de sécurité (paramètre state invalide ou expiré). Veuillez réessayer.";
      this.error.set(msg);
      this.toast.error(msg);
      this.loading.set(false);
      return;
    }

    // Exchange code and state with backend
    this.auth.handleAzureCallback(code, state).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Connexion avec Microsoft réussie !');
        this.router.navigateByUrl('/dashboard');
      },
      error: (err) => {
        this.loading.set(false);
        const detail =
          err?.error?.detail ||
          err?.error?.message ||
          "Impossible de finaliser l'authentification Microsoft. Veuillez réessayer.";
        this.error.set(detail);
        this.toast.error(detail);
      },
    });
  }
}

