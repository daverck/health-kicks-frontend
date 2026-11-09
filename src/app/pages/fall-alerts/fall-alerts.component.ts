import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FallAlertService } from '../../core/services/fall-alert.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import {
  AlertContactCreate,
  AlertContactResponse,
  FallAlertDetail,
  FallAlertSummary,
} from '../../models/api.models';
import {
  formatFallAlertResolution,
  formatFallAlertStateLabel,
  formatFallTypeLabel,
  getFallAlertStateBadgeClass,
  getGoogleMapsUrl,
  getNotificationStatusBadgeClass,
  getSubjectPseudonym,
} from './fall-alerts.formatters';
import { FallHistoryComponent } from './components/fall-history.component';
import { FallContactsComponent } from './components/fall-contacts.component';
import { FallAlertsStore } from './fall-alerts.store';

@Component({
  selector: 'app-fall-alerts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslatePipe,
    FallHistoryComponent,
    FallContactsComponent,
  ],
  providers: [FallAlertsStore],
  templateUrl: './fall-alerts.component.html',
})
export class FallAlertsComponent implements OnInit {
  private readonly store = inject(FallAlertsStore);
  private readonly fallAlertService = inject(FallAlertService);
  private readonly toast = inject(ToastService);
  private readonly translation = inject(TranslationService);
  private readonly fb = inject(FormBuilder);

  readonly activeTab = this.store.activeTab;
  readonly isAdmin = this.store.isAdmin;
  readonly isClinicianOrAdmin = this.store.isClinicianOrAdmin;

  // ---------- Tab 1: Alert History ----------
  readonly availableStates = this.store.availableStates;
  readonly alerts = this.store.alerts;
  readonly selectedState = this.store.selectedState;
  readonly startDate = this.store.startDate;
  readonly endDate = this.store.endDate;
  readonly pseudonymFilter = this.store.pseudonymFilter;
  readonly page = this.store.page;
  readonly pageSize = this.store.pageSize;
  readonly total = this.store.total;
  readonly totalPages = this.store.totalPages;
  readonly loadingAlerts = this.store.loadingAlerts;
  readonly alertsError = this.store.alertsError;

  // Backward compatibility alias for userIdFilter
  get userIdFilter() {
    return this.pseudonymFilter;
  }

  // Detail modal
  readonly selectedAlertDetail = this.store.selectedAlertDetail;
  readonly loadingDetail = this.store.loadingDetail;

  // ---------- Tab 2: Emergency Contacts ----------
  readonly contacts = this.store.contacts;
  readonly loadingContacts = this.store.loadingContacts;
  readonly contactsError = this.store.contactsError;
  readonly editingContact = this.store.editingContact;
  readonly submittingContact = this.store.submittingContact;
  readonly reordering = this.store.reordering;
  readonly sendingTestContactId = this.store.sendingTestContactId;
  readonly deletingContactId = this.store.deletingContactId;
  readonly contactFormError = this.store.contactFormError;
  readonly maxContactsReached = this.store.maxContactsReached;

  readonly contactForm = this.fb.nonNullable.group({
    first_name: ['', [Validators.required, Validators.maxLength(100)]],
    last_name: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(320)]],
    phone: ['', [Validators.maxLength(32), Validators.pattern(/^\s*(\+?[0-9\s().-]{6,32})?\s*$/)]],
  });

  ngOnInit(): void {
    this.store.loadAlerts();
    this.store.loadContacts();
  }

  setTab(tab: 'history' | 'contacts'): void {
    this.store.setTab(tab);
  }

  refresh(): void {
    this.store.refresh();
  }

  // ---------- History Methods ----------

  onStateChange(ev: Event | string): void {
    const value = typeof ev === 'string' ? ev : (ev.target as HTMLSelectElement).value;
    this.store.onStateChange(value);
  }

  onDateChange(range: { startDate: string; endDate: string }): void {
    this.store.onDateChange(range);
  }

  onPseudonymFilterChange(value: string): void {
    this.store.onPseudonymFilterChange(value);
  }

  onUserIdFilterChange(value: string): void {
    this.onPseudonymFilterChange(value);
  }

  goToPage(p: number): void {
    this.store.goToPage(p);
  }

  loadAlerts(): void {
    this.store.loadAlerts();
  }

  openAlertDetail(alertId: number | string): void {
    this.store.openAlertDetail(alertId);
  }

  closeAlertDetail(): void {
    this.store.closeAlertDetail();
  }

  getFallTypeLabel(eventType: string): string {
    return formatFallTypeLabel(eventType, this.translation);
  }

  getStateLabel(state: string): string {
    return formatFallAlertStateLabel(state, this.translation);
  }

  getStateBadgeClass(state: string): string {
    return getFallAlertStateBadgeClass(state);
  }

  getNotificationStatusBadgeClass(status: string): string {
    return getNotificationStatusBadgeClass(status);
  }

  getResolutionText(alert: FallAlertSummary): string {
    return formatFallAlertResolution(alert, this.translation, this.isClinicianOrAdmin());
  }

  getSubjectPseudonym(alert: FallAlertSummary | FallAlertDetail | null | undefined): string {
    return getSubjectPseudonym(alert);
  }

  getGoogleMapsUrl(lat: number, lon: number): string {
    return getGoogleMapsUrl(lat, lon);
  }

  openGoogleMapsForAlert(alert: FallAlertSummary, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (alert.location) {
      window.open(this.getGoogleMapsUrl(alert.location.lat, alert.location.lon), '_blank', 'noopener,noreferrer');
      return;
    }
    const alertId = alert.uuid ?? alert.id;
    this.fallAlertService.getFallAlertDetail(alertId).subscribe({
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
    this.store.loadContacts();
  }

  startEditContact(contact: AlertContactResponse): void {
    this.store.startEditContact(contact);
    this.contactForm.reset({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone ?? '',
    });
  }

  cancelEditContact(): void {
    this.store.cancelEditContact();
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

    this.store.saveContact(payload, () => {
      this.contactForm.reset({ first_name: '', last_name: '', email: '', phone: '' });
    });
  }

  deleteContact(contact: AlertContactResponse): void {
    this.store.deleteContact(contact);
  }

  moveContactUp(index: number): void {
    this.moveContact(index, -1);
  }

  moveContactDown(index: number): void {
    this.moveContact(index, 1);
  }

  moveContact(index: number, direction: -1 | 1): void {
    this.store.moveContact(index, direction);
  }

  sendTestEmail(contact: AlertContactResponse): void {
    this.store.sendTestEmail(contact);
  }
}
