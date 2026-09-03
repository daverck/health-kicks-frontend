import { Component, inject, signal } from '@angular/core';
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
  readonly errorMessage = signal<string | null>(null);

  registerWithGoogle(): void {
    this.loading.set(true);
    this.auth.loginWithGoogle();
  }
}
