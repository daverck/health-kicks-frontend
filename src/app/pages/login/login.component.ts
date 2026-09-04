import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly loadingProvider = signal<'google' | 'microsoft' | null>(null);
  readonly loadingGoogle = computed(() => this.loading() && this.loadingProvider() === 'google');
  readonly loadingMicrosoft = computed(() => this.loading() && this.loadingProvider() === 'microsoft');
  readonly errorMessage = signal<string | null>(null);

  readonly returnUrl = computed(
    () => this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard'
  );

  constructor() {
    const errorParam = this.route.snapshot.queryParamMap.get('error');
    if (errorParam) {
      if (errorParam === 'access_denied') {
        this.errorMessage.set("Connexion annulée : vous avez refusé ou annulé l'authentification.");
      } else {
        this.errorMessage.set(
          this.route.snapshot.queryParamMap.get('error_description') ??
            `Erreur d'authentification : ${errorParam}`
        );
      }
    }
  }

  loginWithGoogle(): void {
    this.loading.set(true);
    this.loadingProvider.set('google');
    this.auth.loginWithGoogle();
  }

  loginWithMicrosoft(): void {
    this.loading.set(true);
    this.loadingProvider.set('microsoft');
    this.auth.loginWithMicrosoft();
  }
}

