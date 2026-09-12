import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '../../core/services/device.service';
import { ToastService } from '../../core/services/toast.service';
import { DeviceResponse, ActivityEvent, HapticLogItem } from '../../models/api.models';
import { intensityToLevel } from '../../core/utils/haptic.utils';
import { PREDEFINED_LABELS } from '../../models/studio.model';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { DeviceSelectComponent } from '../../shared/components/device-select/device-select.component';
import { ActivitySelectComponent } from '../../shared/components/activity-select/activity-select.component';
import { DateFilterComponent } from '../../shared/components/date-filter/date-filter.component';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    DeviceSelectComponent,
    ActivitySelectComponent,
    DateFilterComponent,
  ],
  templateUrl: './history.component.html',
})
export class HistoryComponent implements OnInit {
  private readonly deviceService = inject(DeviceService);
  private readonly toast = inject(ToastService);

  readonly intensityToLevel = intensityToLevel;
  readonly predefinedLabels = PREDEFINED_LABELS;

  readonly devices = signal<DeviceResponse[]>([]);
  readonly selectedDeviceId = signal<string>('');
  readonly activeTab = signal<'activities' | 'haptic'>('activities');

  // Activities history
  readonly events = signal<ActivityEvent[]>([]);
  readonly selectedEventType = signal<string>('all');
  readonly startDate = signal<string>('');
  readonly endDate = signal<string>('');
  readonly page = signal(1);
  readonly pageSize = 20;
  readonly total = signal<number | null>(null);
  readonly totalPages = signal(0);

  // Activities are filtered directly server-side
  readonly filteredEvents = computed<ActivityEvent[]>(() => this.events());

  // Haptic vibrations history
  readonly hapticLogs = signal<HapticLogItem[]>([]);
  readonly hapticStartDate = signal<string>('');
  readonly hapticEndDate = signal<string>('');
  readonly hapticPage = signal(1);
  readonly hapticTotal = signal<number | null>(null);
  readonly hapticTotalPages = signal(0);

  readonly loading = signal(true);
  readonly devicesError = signal(false);
  readonly eventsError = signal(false);

  ngOnInit(): void {
    this.loadDevices();
  }

  setTab(tab: 'activities' | 'haptic' | 'falls'): void {
    const targetTab: 'activities' | 'haptic' = tab === 'falls' ? 'activities' : tab;
    if (this.activeTab() === targetTab) return;
    this.activeTab.set(targetTab);
    this.loadCurrentTab();
  }

  onEventTypeChange(ev: Event | string): void {
    const value = typeof ev === 'string' ? ev : (ev.target as HTMLSelectElement).value;
    this.selectedEventType.set(value);
    this.page.set(1);
    this.loadEvents();
  }

  onDateChange(range: { startDate: string; endDate: string }): void {
    this.startDate.set(range.startDate);
    this.endDate.set(range.endDate);
    this.page.set(1);
    this.loadEvents();
  }

  onHapticDateChange(range: { startDate: string; endDate: string }): void {
    this.hapticStartDate.set(range.startDate);
    this.hapticEndDate.set(range.endDate);
    this.hapticPage.set(1);
    this.loadHapticLogs();
  }

  loadDevices(): void {
    this.deviceService.listDevices().subscribe({
      next: (devices) => {
        this.devices.set(devices);
        this.devicesError.set(false);
        if (devices.length > 0) {
          this.selectedDeviceId.set(devices[0].device_id);
        }
        this.loadCurrentTab();
      },
      error: (err) => {
        this.devices.set([]);
        this.selectedDeviceId.set('');
        this.devicesError.set(true);
        this.loading.set(false);
        this.toast.error(
          err?.status === 0
            ? 'Service temporairement indisponible, veuillez vérifier votre connexion.'
            : 'Impossible de charger vos appareils. Veuillez réessayer plus tard.'
        );
      },
    });
  }

  onDeviceSelected(deviceId: string): void {
    this.selectedDeviceId.set(deviceId);
    this.page.set(1);
    this.hapticPage.set(1);
    this.loadCurrentTab();
  }

  onDeviceChange(ev: Event | string): void {
    const value = typeof ev === 'string' ? ev : (ev.target as HTMLSelectElement).value;
    this.onDeviceSelected(value);
  }

  goToPage(p: number): void {
    if (this.activeTab() === 'activities') {
      this.page.set(Math.max(1, p));
      this.loadEvents();
    } else {
      this.hapticPage.set(Math.max(1, p));
      this.loadHapticLogs();
    }
  }

  refresh(): void {
    this.loadCurrentTab();
  }

  isFall(eventType: string): boolean {
    if (!eventType) return false;
    const lower = eventType.toLowerCase();
    return lower.includes('fall');
  }

  getActivityIcon(eventType: string): string {
    const found = this.predefinedLabels.find((l) => l.id === eventType);
    if (found) return found.icon;
    if (this.isFall(eventType)) return '🚨';
    return '🏷️';
  }

  getActivityBadgeClass(eventType: string): string {
    if (this.isFall(eventType)) {
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300';
    }
    switch (eventType) {
      case 'idle':
        return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200';
      case 'walk':
      case 'run':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'stairs':
      case 'stumble_recover':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300';
    }
  }

  getActivityLabel(eventType: string): string {
    const found = this.predefinedLabels.find((l) => l.id === eventType);
    return found ? found.name : eventType;
  }

  loadCurrentTab(): void {
    if (this.activeTab() === 'activities') {
      this.loadEvents();
    } else {
      this.loadHapticLogs();
    }
  }

  private loadEvents(): void {
    const deviceId = this.selectedDeviceId();
    if (!deviceId) {
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.eventsError.set(false);

    this.deviceService
      .getActivityEvents(
        deviceId,
        this.page(),
        this.pageSize,
        this.selectedEventType(),
        this.startDate(),
        this.endDate()
      )
      .subscribe({
        next: (page) => {
          this.events.set(page.items);
          this.total.set(page.total);
          this.totalPages.set(Math.max(1, Math.ceil(page.total / (page.page_size || this.pageSize))));
          this.loading.set(false);
        },
        error: (err) => {
          this.events.set([]);
          this.total.set(null);
          this.totalPages.set(0);
          this.loading.set(false);
          this.eventsError.set(true);
          this.toast.error(
            err?.status === 0
              ? 'Service temporairement indisponible, veuillez vérifier votre connexion.'
              : "Impossible de charger l'historique des événements."
          );
        },
      });
  }

  private loadHapticLogs(): void {
    const deviceId = this.selectedDeviceId();
    if (!deviceId) {
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.eventsError.set(false);

    this.deviceService
      .getHapticHistory(
        deviceId,
        this.hapticPage(),
        this.pageSize,
        this.hapticStartDate(),
        this.hapticEndDate()
      )
      .subscribe({
        next: (page) => {
          this.hapticLogs.set(page.items);
          this.hapticTotal.set(page.total);
          this.hapticTotalPages.set(Math.max(1, Math.ceil(page.total / (page.page_size || this.pageSize))));
          this.loading.set(false);
        },
        error: (err) => {
          this.hapticLogs.set([]);
          this.hapticTotal.set(null);
          this.hapticTotalPages.set(0);
          this.loading.set(false);
          this.eventsError.set(true);
          this.toast.error(
            err?.status === 0
              ? 'Service temporairement indisponible, veuillez vérifier votre connexion.'
              : "Impossible de charger l'historique des vibrations."
          );
        },
      });
  }
}
