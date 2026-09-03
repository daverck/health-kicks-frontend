import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '../../core/services/device.service';
import { ToastService } from '../../core/services/toast.service';
import { DeviceResponse, FallEventResponse, HapticLogItem } from '../../models/api.models';
import { intensityToLevel } from '../../core/utils/haptic.utils';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
})
export class HistoryComponent implements OnInit {
  private readonly deviceService = inject(DeviceService);
  private readonly toast = inject(ToastService);

  readonly intensityToLevel = intensityToLevel;

  readonly devices = signal<DeviceResponse[]>([]);
  readonly selectedDeviceId = signal<string>('');
  readonly activeTab = signal<'falls' | 'haptic'>('falls');

  // Falls history
  readonly events = signal<FallEventResponse[]>([]);
  readonly page = signal(1);
  readonly pageSize = 20;
  readonly total = signal<number | null>(null);
  readonly totalPages = signal(0);

  // Haptic vibrations history
  readonly hapticLogs = signal<HapticLogItem[]>([]);
  readonly hapticPage = signal(1);
  readonly hapticTotal = signal<number | null>(null);
  readonly hapticTotalPages = signal(0);

  readonly loading = signal(true);
  readonly devicesError = signal(false);
  readonly eventsError = signal(false);

  ngOnInit(): void {
    this.loadDevices();
  }

  setTab(tab: 'falls' | 'haptic'): void {
    if (this.activeTab() === tab) return;
    this.activeTab.set(tab);
    this.loadCurrentTab();
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

  onDeviceChange(ev: Event): void {
    this.selectedDeviceId.set((ev.target as HTMLSelectElement).value);
    this.page.set(1);
    this.hapticPage.set(1);
    this.loadCurrentTab();
  }

  goToPage(p: number): void {
    if (this.activeTab() === 'falls') {
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

  sourceOf(event: FallEventResponse): string {
    return (event as FallEventResponse & { source?: string }).source ?? 'imu';
  }

  loadCurrentTab(): void {
    if (this.activeTab() === 'falls') {
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

    this.deviceService.getFallHistory(deviceId, this.page(), this.pageSize).subscribe({
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

    this.deviceService.getHapticHistory(deviceId, this.hapticPage(), this.pageSize).subscribe({
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
