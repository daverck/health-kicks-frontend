import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DateFilterComponent } from '../../../shared/components/date-filter/date-filter.component';
import { DualScrollbarComponent } from '../../../shared/components/dual-scrollbar/dual-scrollbar.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../core/services/translation.service';
import { FallAlertDetail, FallAlertState, FallAlertSummary } from '../../../models/api.models';
import {
  formatFallAlertResolution,
  formatFallAlertStateLabel,
  formatFallTypeLabel,
  getFallAlertStateBadgeClass,
  getGoogleMapsUrl,
  getSubjectPseudonym,
} from '../fall-alerts.formatters';

@Component({
  selector: 'app-fall-history',
  standalone: true,
  imports: [CommonModule, FormsModule, DateFilterComponent, TranslatePipe, DualScrollbarComponent],
  templateUrl: './fall-history.component.html',
})
export class FallHistoryComponent {
  private readonly translation = inject(TranslationService);

  @Input({ required: true }) alerts: FallAlertSummary[] = [];
  @Input() total: number | null = null;
  @Input() totalPages = 0;
  @Input() page = 1;
  @Input() loading = false;
  @Input() error = false;
  @Input() isAdmin = false;
  @Input() isClinicianOrAdmin = false;

  @Input() selectedState = 'all';
  @Input() startDate = '';
  @Input() endDate = '';
  @Input() pseudonymFilter = '';

  @Output() stateChange = new EventEmitter<string>();
  @Output() dateChange = new EventEmitter<{ startDate: string; endDate: string }>();
  @Output() pseudonymFilterChange = new EventEmitter<string>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() retry = new EventEmitter<void>();
  @Output() openDetail = new EventEmitter<number | string>();
  @Output() openMaps = new EventEmitter<{ alert: FallAlertSummary; event?: Event }>();

  // ---------- New local client filters: Device, Fall Type, Number of Notified Contacts ----------
  readonly selectedDevice = signal<string>('all');
  readonly selectedFallType = signal<string>('all');
  readonly selectedNotifiedCount = signal<string>('all');

  readonly availableStates: ('all' | FallAlertState)[] = [
    'all',
    'PENDING',
    'ESCALATING',
    'ACKNOWLEDGED',
    'CANCELLED',
    'EXHAUSTED',
    'SUPPRESSED',
  ];

  /**
   * Unique device IDs present in the loaded alerts list.
   */
  readonly availableDevices = computed<string[]>(() => {
    const list = this.alerts ?? [];
    const devices = new Set<string>();
    for (const a of list) {
      if (a.device_id && a.device_id.trim()) {
        devices.add(a.device_id.trim());
      }
    }
    return Array.from(devices).sort();
  });

  /**
   * Unique event types (fall types) present in the loaded alerts list.
   */
  readonly availableFallTypes = computed<string[]>(() => {
    const list = this.alerts ?? [];
    const types = new Set<string>();
    for (const a of list) {
      if (a.event_type && a.event_type.trim()) {
        types.add(a.event_type.trim());
      }
    }
    return Array.from(types).sort();
  });

  /**
   * Unique notified contacts counts present in the loaded alerts list.
   */
  readonly availableNotifiedCounts = computed<number[]>(() => {
    const list = this.alerts ?? [];
    const counts = new Set<number>();
    for (const a of list) {
      if (typeof a.notified_contacts_count === 'number') {
        counts.add(a.notified_contacts_count);
      }
    }
    return Array.from(counts).sort((a, b) => a - b);
  });

  /**
   * Filtered alerts taking device, fall_type and notified_contacts_count into account.
   */
  readonly filteredAlerts = computed<FallAlertSummary[]>(() => {
    const list = this.alerts ?? [];
    const dev = this.selectedDevice();
    const type = this.selectedFallType();
    const notif = this.selectedNotifiedCount();

    return list.filter((a) => {
      if (dev !== 'all' && a.device_id !== dev) {
        return false;
      }
      if (type !== 'all' && a.event_type !== type) {
        return false;
      }
      if (notif !== 'all') {
        const expectedCount = parseInt(notif, 10);
        if (a.notified_contacts_count !== expectedCount) {
          return false;
        }
      }
      return true;
    });
  });

  onStateSelectChange(ev: Event | string): void {
    const val = typeof ev === 'string' ? ev : (ev.target as HTMLSelectElement).value;
    this.stateChange.emit(val || 'all');
  }

  onDeviceChange(ev: Event | string): void {
    const val = typeof ev === 'string' ? ev : (ev.target as HTMLSelectElement).value;
    this.selectedDevice.set(val || 'all');
  }

  onFallTypeChange(ev: Event | string): void {
    const val = typeof ev === 'string' ? ev : (ev.target as HTMLSelectElement).value;
    this.selectedFallType.set(val || 'all');
  }

  onNotifiedCountChange(ev: Event | string): void {
    const val = typeof ev === 'string' ? ev : (ev.target as HTMLSelectElement).value;
    this.selectedNotifiedCount.set(val || 'all');
  }

  onDateFilterChange(range: { startDate: string; endDate: string }): void {
    this.dateChange.emit(range);
  }

  onPseudonymChange(value: string): void {
    this.pseudonymFilterChange.emit(value);
  }

  onPageSelect(p: number): void {
    this.pageChange.emit(p);
  }

  onRetry(): void {
    this.retry.emit();
  }

  onAlertClick(alertId: number | string): void {
    this.openDetail.emit(alertId);
  }

  onMapsClick(alert: FallAlertSummary, event?: Event): void {
    this.openMaps.emit({ alert, event });
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

  getResolutionText(alert: FallAlertSummary): string {
    return formatFallAlertResolution(alert, this.translation, this.isClinicianOrAdmin);
  }

  getSubjectPseudonym(alert: FallAlertSummary | FallAlertDetail | null | undefined): string {
    return getSubjectPseudonym(alert);
  }

  getGoogleMapsUrl(lat: number, lon: number): string {
    return getGoogleMapsUrl(lat, lon);
  }
}
