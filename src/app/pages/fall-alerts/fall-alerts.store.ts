import { Injectable, computed, inject, signal } from '@angular/core';
import { FallAlertService } from '../../core/services/fall-alert.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslationService } from '../../core/services/translation.service';
import {
  AlertContactCreate,
  AlertContactResponse,
  AlertContactUpdate,
  FallAlertDetail,
  FallAlertState,
  FallAlertSummary,
} from '../../models/api.models';

@Injectable()
export class FallAlertsStore {
  private readonly fallAlertService = inject(FallAlertService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly translation = inject(TranslationService);

  readonly activeTab = signal<'history' | 'contacts'>('history');

  readonly isAdmin = computed(() => {
    const user = this.auth.currentUser ? this.auth.currentUser() : this.auth.user();
    return user?.role === 'admin';
  });

  readonly isClinicianOrAdmin = computed(() => {
    const user = this.auth.currentUser ? this.auth.currentUser() : this.auth.user();
    return user?.role === 'admin' || user?.role === 'clinician';
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
  readonly pseudonymFilter = signal<string>('');
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
  readonly sendingTestContactId = signal<number | string | null>(null);
  readonly deletingContactId = signal<number | string | null>(null);
  readonly contactFormError = signal<string | null>(null);

  readonly maxContactsReached = computed(
    () => this.contacts().length >= 5 && this.editingContact() === null
  );

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

  onStateChange(value: string): void {
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

  onPseudonymFilterChange(value: string): void {
    this.pseudonymFilter.set(value);
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

    const filterVal = this.isAdmin() ? this.pseudonymFilter() : undefined;

    this.fallAlertService
      .listFallAlerts({
        page: this.page(),
        pageSize: this.pageSize,
        state: this.selectedState(),
        startDate: this.startDate(),
        endDate: this.endDate(),
        pseudonym: filterVal,
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

  openAlertDetail(alertId: number | string): void {
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
  }

  cancelEditContact(): void {
    this.editingContact.set(null);
    this.contactFormError.set(null);
  }

  saveContact(
    payload: AlertContactCreate,
    onSuccess?: () => void
  ): void {
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
      const contactIdentifier = editing.uuid ?? editing.id;
      this.fallAlertService.updateAlertContact(contactIdentifier, updatePayload).subscribe({
        next: () => {
          this.submittingContact.set(false);
          this.cancelEditContact();
          this.toast.success(this.translation.translate('fall_alerts.toast_contact_updated'));
          this.loadContacts();
          onSuccess?.();
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
          this.toast.success(this.translation.translate('fall_alerts.toast_contact_added'));
          this.loadContacts();
          onSuccess?.();
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
    const contactIdentifier = contact.uuid ?? contact.id;
    if (this.deletingContactId() !== null) return;
    this.deletingContactId.set(contactIdentifier);

    this.fallAlertService.deleteAlertContact(contactIdentifier).subscribe({
      next: () => {
        this.deletingContactId.set(null);
        if (this.editingContact()?.id === contact.id || (contact.uuid && this.editingContact()?.uuid === contact.uuid)) {
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
    const contactIdentifier = contact.uuid ?? contact.id;
    if (this.sendingTestContactId() !== null) return;
    this.sendingTestContactId.set(contactIdentifier);

    this.fallAlertService.sendTestEmail(contactIdentifier).subscribe({
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
