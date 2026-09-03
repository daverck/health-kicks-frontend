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
  readonly errorMessage = signal<string | null>(null);

  readonly returnUrl = computed(
    () => this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard'
  );

  loginWithGoogle(): void {
    this.loading.set(true);
    this.auth.loginWithGoogle();
  }
}
