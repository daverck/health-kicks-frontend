import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FallAlertService } from '../../core/services/fall-alert.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { DateFilterComponent } from '../../shared/components/date-filter/date-filter.component';
import {
  AlertContactCreate,
  AlertContactResponse,
  AlertContactUpdate,
  FallAlertDetail,
  FallAlertState,
  FallAlertSummary,
} from '../../models/api.models';
import { PREDEFINED_LABELS, isStandardStudioLabel } from '../../models/studio.model';

@Component({
  selector: 'app-fall-alerts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslatePipe,
    DateFilterComponent,
  ],
  templateUrl: './fall-alerts.component.html',
})
export class FallAlertsComponent implements OnInit {
  private readonly fallAlertService = inject(FallAlertService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly translation = inject(TranslationService);
  private readonly fb = inject(FormBuilder);

  readonly activeTab = signal<'history' | 'contacts'>('history');

  readonly isAdmin = computed(() => {
    const user = this.auth.currentUser ? this.auth.currentUser() : this.auth.user();
    return user?.role === 'admin';
  });

  // ---------- Tab 1: Alert History ----------
  readonly availableStates: ('all' | FallAlertState)[] = [
    'all',
    'PENDING',
    'ESCALATING',
    'ACKNOWLEDGED',
    'CANCELLED',
    'EXHAUSTED',
    'SUPPRESSED',
  ];

  readonly alerts = signal<FallAlertSummary[]>([]);
  readonly selectedState = signal<string>('all');
  readonly startDate = signal<string>('');
  readonly endDate = signal<string>('');
  readonly userIdFilter = signal<string>('');
  readonly page = signal<number>(1);
  readonly pageSize = 20;
  readonly total = signal<number | null>(null);
  readonly totalPages = signal<number>(0);
  readonly loadingAlerts = signal<boolean>(true);
  readonly alertsError = signal<boolean>(false);

  // Detail modal
  readonly selectedAlertDetail = signal<FallAlertDetail | null>(null);
  readonly loadingDetail = signal<boolean>(false);

  // ---------- Tab 2: Emergency Contacts ----------
  readonly contacts = signal<AlertContactResponse[]>([]);
  readonly loadingContacts = signal<boolean>(false);
  readonly contactsError = signal<boolean>(false);
  readonly editingContact = signal<AlertContactResponse | null>(null);
  readonly submittingContact = signal<boolean>(false);
  readonly reordering = signal<boolean>(false);
  readonly sendingTestContactId = signal<number | null>(null);
  readonly deletingContactId = signal<number | null>(null);
  readonly contactFormError = signal<string | null>(null);

  readonly maxContactsReached = computed(
    () => this.contacts().length >= 5 && this.editingContact() === null
  );

  readonly contactForm = this.fb.nonNullable.group({
    first_name: ['', [Validators.required, Validators.maxLength(100)]],
    last_name: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(320)]],
    phone: ['', [Validators.maxLength(32), Validators.pattern(/^\s*(\+?[0-9\s().\-]{6,32})?\s*$/)]],
  });

  ngOnInit(): void {
    this.loadAlerts();
    this.loadContacts();
  }

  setTab(tab: 'history' | 'contacts'): void {
    if (this.activeTab() === tab) return;
    this.activeTab.set(tab);
    if (tab === 'history') {
      this.loadAlerts();
    } else {
      this.loadContacts();
    }
  }

  refresh(): void {
    if (this.activeTab() === 'history') {
      this.loadAlerts();
    } else {
      this.loadContacts();
    }
  }

  // ---------- History Methods ----------

  onStateChange(ev: Event | string): void {
    const value = typeof ev === 'string' ? ev : (ev.target as HTMLSelectElement).value;
    this.selectedState.set(value || 'all');
    this.page.set(1);
    this.loadAlerts();
  }

  onDateChange(range: { startDate: string; endDate: string }): void {
    this.startDate.set(range.startDate);
    this.endDate.set(range.endDate);
    this.page.set(1);
    this.loadAlerts();
  }

  onUserIdFilterChange(value: string): void {
    this.userIdFilter.set(value);
    this.page.set(1);
    this.loadAlerts();
  }

  goToPage(p: number): void {
    this.page.set(Math.max(1, p));
    this.loadAlerts();
  }

  loadAlerts(): void {
    this.loadingAlerts.set(true);
    this.alertsError.set(false);

    this.fallAlertService
      .listFallAlerts({
        page: this.page(),
        pageSize: this.pageSize,
        state: this.selectedState(),
        startDate: this.startDate(),
        endDate: this.endDate(),
        userId: this.isAdmin() ? this.userIdFilter() : undefined,
      })
      .subscribe({
        next: (res) => {
          this.alerts.set(res.items);
          this.total.set(res.total);
          this.totalPages.set(Math.max(1, Math.ceil(res.total / (res.page_size || this.pageSize))));
          this.loadingAlerts.set(false);
        },
        error: () => {
          this.alerts.set([]);
          this.total.set(null);
          this.totalPages.set(0);
          this.loadingAlerts.set(false);
          this.alertsError.set(true);
          this.toast.error(this.translation.translate('fall_alerts.load_error_alerts'));
        },
      });
  }

  openAlertDetail(alertId: number): void {
    this.loadingDetail.set(true);
    this.fallAlertService.getFallAlertDetail(alertId).subscribe({
      next: (detail) => {
        this.selectedAlertDetail.set(detail);
        this.loadingDetail.set(false);
      },
      error: () => {
        this.loadingDetail.set(false);
        this.toast.error(this.translation.translate('fall_alerts.load_error_alerts'));
      },
    });
  }

  closeAlertDetail(): void {
    this.selectedAlertDetail.set(null);
  }

  getFallTypeLabel(eventType: string): string {
    if (eventType === 'fall_generic') {
      return this.translation.translate('fall_alerts.fall_generic');
    }
    if (isStandardStudioLabel(eventType)) {
      const key = `studio.labels.${eventType}`;
      const translated = this.translation.translate(key);
      if (translated !== key) return translated;
    }
    const found = PREDEFINED_LABELS.find((l) => l.id === eventType);
    return found ? found.name : eventType;
  }

  getStateLabel(state: string): string {
    const key = `fall_alerts.state_${state}`;
    const translated = this.translation.translate(key);
    return translated !== key ? translated : state;
  }

  getStateBadgeClass(state: string): string {
    switch (state) {
      case 'ACKNOWLEDGED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
      case 'PENDING':
      case 'ESCALATING':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
      case 'EXHAUSTED':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      case 'CANCELLED':
      case 'SUPPRESSED':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  }

  getNotificationStatusBadgeClass(status: string): string {
    switch (status) {
      case 'ACKNOWLEDGED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'PENDING_SMS':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300';
      case 'SENT':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300';
      case 'FAILED':
      default:
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300';
    }
  }

  getResolutionText(alert: FallAlertSummary): string {
    if (alert.acknowledged_by) {
      const fullName = `${alert.acknowledged_by.first_name} ${alert.acknowledged_by.last_name}`.trim();
      return this.translation.translate('fall_alerts.ack_by_label', { name: fullName });
    }
    if (alert.cancel_reason === 'user_cancel') {
      return this.translation.translate('fall_alerts.cancel_user_cancel');
    }
    if (alert.cancel_reason === 'fall_recovery') {
      return this.translation.translate('fall_alerts.cancel_fall_recovery');
    }
    return '—';
  }

  getGoogleMapsUrl(lat: number, lon: number): string {
    return `https://www.google.com/maps?q=${lat},${lon}`;
  }

  openGoogleMapsForAlert(alert: FallAlertSummary, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (alert.location) {
      window.open(this.getGoogleMapsUrl(alert.location.lat, alert.location.lon), '_blank', 'noopener,noreferrer');
      return;
    }
    this.fallAlertService.getFallAlertDetail(alert.id).subscribe({
      next: (detail) => {
        if (detail.location) {
          window.open(this.getGoogleMapsUrl(detail.location.lat, detail.location.lon), '_blank', 'noopener,noreferrer');
        } else {
          this.toast.info(this.translation.translate('fall_alerts.no_location'));
        }
      },
      error: () => {
        this.toast.error(this.translation.translate('fall_alerts.load_error_alerts'));
      },
    });
  }

  // ---------- Emergency Contacts Methods ----------

  loadContacts(): void {
    this.loadingContacts.set(true);
    this.contactsError.set(false);

    this.fallAlertService.listAlertContacts().subscribe({
      next: (items) => {
        const sorted = [...items].sort((a, b) => a.priority - b.priority);
        this.contacts.set(sorted);
        this.loadingContacts.set(false);
      },
      error: () => {
        this.contacts.set([]);
        this.loadingContacts.set(false);
        this.contactsError.set(true);
      },
    });
  }

  startEditContact(contact: AlertContactResponse): void {
    this.editingContact.set(contact);
    this.contactFormError.set(null);
    this.contactForm.reset({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone ?? '',
    });
  }

  cancelEditContact(): void {
    this.editingContact.set(null);
    this.contactFormError.set(null);
    this.contactForm.reset({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
    });
  }

  onSubmitContact(): void {
    if (this.contactForm.invalid || this.submittingContact() || this.maxContactsReached()) {
      this.contactForm.markAllAsTouched();
      return;
    }

    const raw = this.contactForm.getRawValue();
    const payload: AlertContactCreate = {
      first_name: raw.first_name.trim(),
      last_name: raw.last_name.trim(),
      email: raw.email.trim().toLowerCase(),
      phone: raw.phone.trim() || null,
    };

    this.submittingContact.set(true);
    this.contactFormError.set(null);

    const editing = this.editingContact();
    if (editing) {
      const updatePayload: AlertContactUpdate = {
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        phone: payload.phone ?? null,
      };
      this.fallAlertService.updateAlertContact(editing.id, updatePayload).subscribe({
        next: () => {
          this.submittingContact.set(false);
          this.cancelEditContact();
          this.toast.success(this.translation.translate('fall_alerts.toast_contact_updated'));
          this.loadContacts();
        },
        error: (err) => {
          this.submittingContact.set(false);
          const msg = err?.error?.detail || 'Impossible de modifier ce proche.';
          this.contactFormError.set(typeof msg === 'string' ? msg : 'Erreur de validation.');
        },
      });
    } else {
      this.fallAlertService.addAlertContact(payload).subscribe({
        next: () => {
          this.submittingContact.set(false);
          this.contactForm.reset({ first_name: '', last_name: '', email: '', phone: '' });
          this.toast.success(this.translation.translate('fall_alerts.toast_contact_added'));
          this.loadContacts();
        },
        error: (err) => {
          this.submittingContact.set(false);
          const msg = err?.error?.detail || "Impossible d'ajouter ce proche.";
          this.contactFormError.set(typeof msg === 'string' ? msg : 'Erreur de validation.');
        },
      });
    }
  }

  deleteContact(contact: AlertContactResponse): void {
    if (this.deletingContactId() !== null) return;
    this.deletingContactId.set(contact.id);

    this.fallAlertService.deleteAlertContact(contact.id).subscribe({
      next: () => {
        this.deletingContactId.set(null);
        if (this.editingContact()?.id === contact.id) {
          this.cancelEditContact();
        }
        this.toast.success(this.translation.translate('fall_alerts.toast_contact_deleted'));
        this.loadContacts();
      },
      error: () => {
        this.deletingContactId.set(null);
        this.toast.error('Impossible de supprimer ce proche.');
      },
    });
  }

  moveContactUp(index: number): void {
    this.moveContact(index, -1);
  }

  moveContactDown(index: number): void {
    this.moveContact(index, 1);
  }

  moveContact(index: number, direction: -1 | 1): void {
    const current = [...this.contacts()];
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= current.length || this.reordering()) {
      return;
    }

    const temp = current[index];
    current[index] = current[targetIndex];
    current[targetIndex] = temp;

    const orderedIds = current.map((c) => c.id);
    this.reordering.set(true);

    this.fallAlertService.reorderAlertContacts({ contact_ids: orderedIds }).subscribe({
      next: (updated) => {
        this.reordering.set(false);
        const sorted = [...updated].sort((a, b) => a.priority - b.priority);
        this.contacts.set(sorted);
        this.toast.success(this.translation.translate('fall_alerts.toast_order_updated'));
      },
      error: () => {
        this.reordering.set(false);
        this.toast.error("Impossible de réordonner les proches d'urgence.");
      },
    });
  }

  sendTestEmail(contact: AlertContactResponse): void {
    if (this.sendingTestContactId() !== null) return;
    this.sendingTestContactId.set(contact.id);

    this.fallAlertService.sendTestEmail(contact.id).subscribe({
      next: (res) => {
        this.sendingTestContactId.set(null);
        this.contacts.update((list) =>
          list.map((c) => (c.id === contact.id ? { ...c, last_test_email_at: res.sent_at } : c))
        );
        this.toast.success(
          res.sms_dispatched
            ? this.translation.translate('fall_alerts.toast_test_email_and_sms_sent', {
                name: contact.first_name,
              })
            : this.translation.translate('fall_alerts.toast_test_email_sent_to', {
                email: contact.email,
              })
        );
      },
      error: (err) => {
        this.sendingTestContactId.set(null);
        const detail = err?.error?.detail;
        this.toast.error(
          typeof detail === 'string'
            ? detail
            : "Impossible d'envoyer l'email de test. Veuillez réessayer plus tard."
        );
      },
    });
  }
}
