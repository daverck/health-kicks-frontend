import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '../../core/services/device.service';
import { ToastService } from '../../core/services/toast.service';
import { DeviceResponse, FallEventResponse } from '../../models/api.models';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
})
export class HistoryComponent implements OnInit {
  private readonly deviceService = inject(DeviceService);
  private readonly toast = inject(ToastService);

  readonly devices = signal<DeviceResponse[]>([]);
  readonly selectedDeviceId = signal<string>('');
  readonly events = signal<FallEventResponse[]>([]);
  readonly loading = signal(true);
  readonly devicesError = signal(false);
  readonly eventsError = signal(false);

  readonly page = signal(1);
  readonly pageSize = 20;
  readonly total = signal<number | null>(null);

  readonly totalPages = signal(0);

  ngOnInit(): void {
    this.loadDevices();
  }

  loadDevices(): void {
    this.deviceService.listDevices().subscribe({
      next: (devices) => {
        this.devices.set(devices);
        this.devicesError.set(false);
        if (devices.length > 0) {
          this.selectedDeviceId.set(devices[0].device_id);
        }
        this.loadEvents();
      },
      error: (err) => {
        // Aucun fallback mock : l'erreur est remontée à l'UI.
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
    this.goToPage(1);
  }

  goToPage(p: number): void {
    this.page.set(Math.max(1, p));
    this.loadEvents();
  }

  refresh(): void {
    this.loadEvents();
  }

  sourceOf(event: FallEventResponse): string {
    // `source` is an extra display field provided by the mock service.
    return (event as FallEventResponse & { source?: string }).source ?? 'imu';
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
}
