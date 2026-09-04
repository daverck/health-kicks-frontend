import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly loadingProvider = signal<'google' | 'microsoft' | null>(null);
  readonly loadingGoogle = computed(() => this.loading() && this.loadingProvider() === 'google');
  readonly loadingMicrosoft = computed(() => this.loading() && this.loadingProvider() === 'microsoft');
  readonly errorMessage = signal<string | null>(null);

  registerWithGoogle(): void {
    this.loading.set(true);
    this.loadingProvider.set('google');
    this.auth.loginWithGoogle();
  }

  registerWithMicrosoft(): void {
    this.loading.set(true);
    this.loadingProvider.set('microsoft');
    this.auth.loginWithMicrosoft();
  }
}

