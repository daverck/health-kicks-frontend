import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

/**
 * Handles the redirect back from Google via the backend callback:
 * either the backend returns tokens to this SPA route (query params),
 * or it forwards `code` + `state` and this component exchanges them.
 */
@Component({
  selector: 'app-google-callback',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './google-callback.component.html',
})
export class GoogleCallbackComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly error = signal<string | null>(null);

  constructor() {
    const params = this.route.snapshot.queryParamMap;

    if (params.get('error')) {
      this.error.set(params.get('error')!);
      return;
    }

    const token = params.get('access_token') ?? params.get('token');
    if (token) {
      // Backend already exchanged the code and returned a JWT in the URL.
      this.auth.setToken(token);
      this.router.navigateByUrl('/dashboard');
      return;
    }

    const code = params.get('code');
    const state = params.get('state');
    if (code && state) {
      this.auth.handleGoogleCallback(code, state).subscribe({
        next: () => this.router.navigateByUrl('/dashboard'),
        error: () =>
          this.error.set("Impossible de finaliser l'authentification Google. Veuillez réessayer."),
      });
      return;
    }

    this.error.set('Paramètres de callback manquants.');
  }
}
