import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FallAlertService } from '../../core/services/fall-alert.service';
import { FallAlertAckInfo, FallAlertAckResult } from '../../models/api.models';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

export type AckViewState =
  | 'loading'
  | 'pending_confirmation'
  | 'just_confirmed'
  | 'already_acknowledged'
  | 'cancelled'
  | 'invalid_or_expired';

@Component({
  selector: 'app-fall-alert-ack',
  standalone: true,
  imports: [RouterLink, LanguageSelectorComponent, ThemeToggleComponent],
  templateUrl: './fall-alert-ack.component.html',
})
export class FallAlertAckComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fallAlertService = inject(FallAlertService);

  readonly token = signal<string>('');
  readonly loading = signal<boolean>(true);
  readonly confirming = signal<boolean>(false);
  readonly ackInfo = signal<FallAlertAckInfo | null>(null);
  readonly ackResult = signal<FallAlertAckResult | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly isExpired = signal<boolean>(false);

  readonly viewState = computed<AckViewState>(() => {
    if (this.loading()) {
      return 'loading';
    }
    if (this.errorMessage()) {
      return 'invalid_or_expired';
    }
    if (this.ackResult()) {
      return 'just_confirmed';
    }
    const info = this.ackInfo();
    if (!info) {
      return 'invalid_or_expired';
    }
    if (info.state === 'ACKNOWLEDGED') {
      return 'already_acknowledged';
    }
    if (info.state === 'CANCELLED') {
      return 'cancelled';
    }
    if (info.state === 'ESCALATING' || info.state === 'EXHAUSTED' || info.state === 'PENDING') {
      return 'pending_confirmation';
    }
    return 'pending_confirmation';
  });

  ngOnInit(): void {
    const rawToken = this.route.snapshot.queryParamMap.get('token') ?? '';
    const cleanToken = rawToken.trim();
    this.token.set(cleanToken);

    if (!cleanToken) {
      this.errorMessage.set(
        'Aucun jeton de prise en charge valide n’a été fourni dans le lien.'
      );
      this.isExpired.set(false);
      this.loading.set(false);
      return;
    }

    this.loadAckInfo(cleanToken);
  }

  loadAckInfo(tokenValue: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.fallAlertService.getAckInfo(tokenValue).subscribe({
      next: (info) => {
        this.ackInfo.set(info);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const detail = err?.error?.detail;
        let msg = 'Ce lien de prise en charge est invalide ou introuvable.';
        let expired = false;

        if (typeof detail === 'string') {
          msg = detail;
          expired = detail.toLowerCase().includes('expir');
        } else if (detail && typeof detail === 'object') {
          msg = detail.message || msg;
          expired = Boolean(detail.expired);
        }

        this.errorMessage.set(msg);
        this.isExpired.set(expired);
      },
    });
  }

  onConfirmAck(): void {
    const tokenValue = this.token();
    if (!tokenValue || this.confirming()) {
      return;
    }

    this.confirming.set(true);

    this.fallAlertService.confirmAck(tokenValue).subscribe({
      next: (res) => {
        this.ackResult.set(res);
        this.confirming.set(false);
      },
      error: (err) => {
        this.confirming.set(false);
        const detail = err?.error?.detail;
        let msg = 'Une erreur est survenue lors de la confirmation de prise en charge.';
        let expired = false;

        if (typeof detail === 'string') {
          msg = detail;
          expired = detail.toLowerCase().includes('expir');
        } else if (detail && typeof detail === 'object') {
          msg = detail.message || msg;
          expired = Boolean(detail.expired);
        }

        this.errorMessage.set(msg);
        this.isExpired.set(expired);
      },
    });
  }
}
