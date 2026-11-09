import { Injectable, computed, inject, signal } from '@angular/core';
import { DeviceService } from '../../core/services/device.service';
import { ToastService } from '../../core/services/toast.service';
import { DeviceResponse, ActivityEvent, HapticLogItem } from '../../models/api.models';
import { resolvePreferredDevice } from '../../shared/formatters/device.formatters';

@Injectable()
export class HistoryStore {
  private readonly deviceService = inject(DeviceService);
  private readonly toast = inject(ToastService);

  readonly devices = signal<DeviceResponse[]>([]);
  readonly selectedDeviceId = signal<string>('');
  readonly selectedDeviceIds = signal<string[]>([]);
  readonly activeTab = signal<'activities' | 'haptic'>('activities');

  // Activities history
  readonly events = signal<ActivityEvent[]>([]);
  readonly selectedEventType = signal<string>('all');
  readonly selectedEventTypes = signal<string[]>([]);
  readonly startDate = signal<string>('');
  readonly endDate = signal<string>('');
  readonly page = signal(1);
  readonly pageSize = 20;
  readonly total = signal<number | null>(null);
  readonly totalPages = signal(0);

  // Activities filtered directly server-side
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

  setTab(tab: 'activities' | 'haptic' | 'falls'): void {
    const targetTab: 'activities' | 'haptic' = tab === 'falls' ? 'activities' : tab;
    if (this.activeTab() === targetTab) return;
    this.activeTab.set(targetTab);
    this.loadCurrentTab();
  }

  onEventTypeChange(ev: Event | string): void {
    const value = typeof ev === 'string' ? ev : (ev.target as HTMLSelectElement).value;
    this.selectedEventType.set(value);
    this.selectedEventTypes.set(value && value !== 'all' ? [value] : []);
    this.page.set(1);
    this.loadEvents();
  }

  onEventTypesChange(types: string[]): void {
    this.selectedEventTypes.set(types);
    this.selectedEventType.set(types.length === 0 ? 'all' : types.join(','));
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
        const preferred = resolvePreferredDevice(devices);
        if (preferred) {
          this.selectedDeviceId.set(preferred.device_id);
          this.selectedDeviceIds.set([preferred.device_id]);
        }
        this.loadCurrentTab();
      },
      error: (err) => {
        this.devices.set([]);
        this.selectedDeviceId.set('');
        this.selectedDeviceIds.set([]);
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
    this.selectedDeviceIds.set(deviceId && deviceId !== 'all' ? [deviceId] : []);
    this.page.set(1);
    this.hapticPage.set(1);
    this.loadCurrentTab();
  }

  onDeviceIdsChange(deviceIds: string[]): void {
    this.selectedDeviceIds.set(deviceIds);
    this.selectedDeviceId.set(deviceIds.length === 0 ? 'all' : deviceIds.join(','));
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

  loadCurrentTab(): void {
    if (this.activeTab() === 'activities') {
      this.loadEvents();
    } else {
      this.loadHapticLogs();
    }
  }

  loadEvents(): void {
    const deviceParam =
      this.selectedDeviceIds().length > 0
        ? this.selectedDeviceIds().join(',')
        : this.selectedDeviceId() || 'all';
    if (this.devices().length === 0 && !this.selectedDeviceId()) {
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.eventsError.set(false);

    const typeParam =
      this.selectedEventTypes().length > 0
        ? this.selectedEventTypes().join(',')
        : this.selectedEventType();

    this.deviceService
      .getActivityEvents(
        deviceParam,
        this.page(),
        this.pageSize,
        typeParam,
        this.startDate(),
        this.endDate()
      )
      .subscribe({
        next: (page) => {
          this.events.set(page.items);
          this.total.set(page.total);
          this.totalPages.set(
            Math.max(1, Math.ceil(page.total / (page.page_size || this.pageSize)))
          );
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

  loadHapticLogs(): void {
    const deviceParam =
      this.selectedDeviceIds().length > 0
        ? this.selectedDeviceIds().join(',')
        : this.selectedDeviceId() || 'all';
    if (this.devices().length === 0 && !this.selectedDeviceId()) {
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.eventsError.set(false);

    this.deviceService
      .getHapticHistory(
        deviceParam,
        this.hapticPage(),
        this.pageSize,
        this.hapticStartDate(),
        this.hapticEndDate()
      )
      .subscribe({
        next: (page) => {
          this.hapticLogs.set(page.items);
          this.hapticTotal.set(page.total);
          this.hapticTotalPages.set(
            Math.max(1, Math.ceil(page.total / (page.page_size || this.pageSize)))
          );
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
