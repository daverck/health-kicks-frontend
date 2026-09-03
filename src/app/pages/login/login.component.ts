import { Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly returnUrl = computed(
    () => this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard'
  );

  onSubmit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => {
        this.toast.success('Connexion réussie !');
        this.router.navigateByUrl(this.returnUrl());
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err?.status === 0
            ? 'Backend injoignable. Vérifiez que le serveur API est démarré.'
            : (err?.error?.detail ?? 'Identifiants invalides ou service indisponible.')
        );
      },
    });
  }

  loginWithGoogle(): void {
    this.auth.loginWithGoogle();
  }
}
