import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DeviceService } from '../../core/services/device.service';
import { ToastService } from '../../core/services/toast.service';
import { DeviceResponse, FallEventResponse, HapticLogItem, HapticTriggerResponse } from '../../models/api.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private readonly deviceService = inject(DeviceService);
  private readonly toast = inject(ToastService);

  readonly devices = signal<DeviceResponse[]>([]);
  readonly selectedDevice = signal<DeviceResponse | null>(null);
  readonly loadingDevices = signal(true);
  readonly devicesError = signal(false);
  readonly eventsError = signal(false);

  readonly intensity = signal(180);
  readonly durationMs = signal(500);
  readonly triggering = signal(false);
  readonly vibrating = signal(false);

  readonly recentEvents = signal<FallEventResponse[]>([]);
  readonly recentHapticLogs = signal<HapticLogItem[]>([]);

  ngOnInit(): void {
    this.loadDevices();
  }

  loadDevices(): void {
    this.loadingDevices.set(true);
    this.deviceService.listDevices().subscribe({
      next: (devices) => {
        this.devices.set(devices);
        if (!this.selectedDevice() && devices.length > 0) {
          this.selectedDevice.set(devices[0]);
        }
        this.loadingDevices.set(false);
        this.loadRecentEvents();
        this.loadRecentHapticLogs();
      },
      error: (err) => {
        // Aucun fallback mock : l'erreur est remontée à l'UI.
        this.devices.set([]);
        this.selectedDevice.set(null);
        this.loadingDevices.set(false);
        this.devicesError.set(true);
        this.toast.error(
          err?.status === 0
            ? 'Service temporairement indisponible, veuillez vérifier votre connexion.'
            : 'Impossible de charger vos appareils. Veuillez réessayer plus tard.'
        );
      },
    });
  }

  selectDevice(device: DeviceResponse): void {
    this.selectedDevice.set(device);
    this.loadRecentEvents();
    this.loadRecentHapticLogs();
  }

  triggerHaptic(): void {
    const device = this.selectedDevice();
    if (!device || this.triggering() || device.status !== 'online') return;

    this.triggering.set(true);

    const payload = { intensity: this.intensity(), duration_ms: this.durationMs() };

    this.deviceService.triggerHaptic(device.device_id, payload).subscribe({
      next: (_res: HapticTriggerResponse) => {
        this.triggering.set(false);
        this.vibrating.set(true);
        setTimeout(() => this.vibrating.set(false), 1200);
        this.toast.success(`Vibration envoyée à ${device.name || device.device_id} !`);
        this.loadRecentHapticLogs();
      },
      error: (err) => {
        this.triggering.set(false);
        this.toast.error(
          err?.status === 0
            ? 'Service temporairement indisponible, veuillez vérifier votre connexion.'
            : (err?.error?.detail ?? 'Échec du déclenchement de la vibration.')
        );
      },
    });
  }

  private loadRecentEvents(): void {
    const device = this.selectedDevice();
    if (!device) return;
    this.eventsError.set(false);
    this.deviceService.getFallHistory(device.device_id, 1, 5).subscribe({
      next: (page) => this.recentEvents.set(page?.items ?? []),
      error: () => {
        this.recentEvents.set([]);
        this.eventsError.set(true);
      },
    });
  }

  loadRecentHapticLogs(): void {
    const device = this.selectedDevice();
    if (!device) return;
    this.deviceService.getHapticHistory(device.device_id, 1, 5).subscribe({
      next: (page) => this.recentHapticLogs.set(page?.items ?? []),
      error: () => this.recentHapticLogs.set([]),
    });
  }
}
