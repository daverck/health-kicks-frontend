import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { UserResponse } from '../../models/api.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: [''],
    email: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
    const user = this.auth.user();
    if (user) {
      this.patchForm(user);
      this.loading.set(false);
    }
    this.auth.loadMe().subscribe({
      next: (fresh) => {
        this.patchForm(fresh);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        if (!user) this.toast.error('Impossible de charger le profil.');
      },
    });
  }

  initials(user: UserResponse): string {
    const source = user.name || user.email;
    return source
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join('');
  }

  save(): void {
    const user = this.auth.user();
    if (!user || this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.errorMessage.set(null);

    const { name, email } = this.form.getRawValue();
    this.userService.updateProfile(user.id, { name, email }).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.toast.success('Profil mis à jour !');
        // Refresh the local user copy (me endpoint reflects persisted changes).
        this.auth.loadMe().subscribe({ error: () => {} });
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(
          err?.status === 0
            ? 'Backend injoignable.'
            : err?.error?.detail ?? "Impossible d'enregistrer les modifications."
        );
      },
    });
  }

  private patchForm(user: UserResponse): void {
    this.form.patchValue({ name: user.name ?? '', email: user.email });
  }
}
