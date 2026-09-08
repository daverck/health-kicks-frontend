import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { UserResponse } from '../../models/api.models';

import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  readonly translation = inject(TranslationService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: [''],
    email: [{ value: '', disabled: true }],
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

  roleLabel(role: string): string {
    if (!role) return '';
    const key = `profile.roles.${role}`;
    const translated = this.translation.translate(key);
    return translated !== key ? translated : role;
  }

  roleBadgeClass(role: string): string {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'clinician':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-primary-50 text-primary-700 border-primary-200';
    }
  }

  save(): void {
    const user = this.auth.user();
    if (!user || this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.errorMessage.set(null);

    const payload = this.form.value;
    this.userService.updateProfile(user.id, payload).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.toast.success('Profil mis à jour !');
        // Refresh the local user copy (me endpoint reflects persisted changes).
        this.auth.loadMe().subscribe({ error: () => { } });
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
