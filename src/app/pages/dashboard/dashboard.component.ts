import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DeviceService } from '../../core/services/device.service';
import { ToastService } from '../../core/services/toast.service';
import { DeviceResponse, HapticLogItem, HapticTriggerResponse } from '../../models/api.models';
import { intensityToLevel, levelToIntensity } from '../../core/utils/haptic.utils';

import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private readonly deviceService = inject(DeviceService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly devices = signal<DeviceResponse[]>([]);
  readonly selectedDevice = signal<DeviceResponse | null>(null);
  readonly loadingDevices = signal(true);
  readonly devicesError = signal(false);

  readonly isDeviceDropdownOpen = signal(false);
  readonly deviceSearchQuery = signal('');

  readonly filteredDevices = computed(() => {
    const query = this.deviceSearchQuery().trim().toLowerCase();
    const all = this.devices();
    if (!query) return all;
    return all.filter(
      (d) =>
        (d.name || '').toLowerCase().includes(query) ||
        d.device_id.toLowerCase().includes(query)
    );
  });

  toggleDeviceDropdown(): void {
    this.isDeviceDropdownOpen.update((open) => !open);
    if (!this.isDeviceDropdownOpen()) {
      this.deviceSearchQuery.set('');
    }
  }

  closeDeviceDropdown(): void {
    this.isDeviceDropdownOpen.set(false);
    this.deviceSearchQuery.set('');
  }

  readonly vibrationLevel = signal(5);
  readonly intensity = computed(() => levelToIntensity(this.vibrationLevel()));
  readonly durationMs = signal(500);
  readonly triggering = signal(false);
  readonly vibrating = signal(false);

  readonly intensityToLevel = intensityToLevel;

  setVibrationLevel(level: number): void {
    this.vibrationLevel.set(Math.max(1, Math.min(10, Math.round(level))));
  }

  readonly recentHapticLogs = signal<HapticLogItem[]>([]);

  ngOnInit(): void {
    this.loadDevices();

    this.route.queryParamMap.subscribe((params) => {
      const deviceId = params.get('deviceId');
      if (deviceId && this.devices().length > 0) {
        const found = this.devices().find((d) => d.device_id === deviceId);
        if (found && this.selectedDevice()?.device_id !== found.device_id) {
          this.selectedDevice.set(found);
          this.loadRecentHapticLogs();
        }
      }
    });
  }

  loadDevices(): void {
    this.loadingDevices.set(true);
    this.deviceService.listDevices().subscribe({
      next: (devices) => {
        this.devices.set(devices);
        const targetId = this.route.snapshot.queryParamMap.get('deviceId');
        const matched = targetId ? devices.find((d) => d.device_id === targetId) : null;
        if (matched) {
          this.selectedDevice.set(matched);
        } else if (!this.selectedDevice() && devices.length > 0) {
          this.selectedDevice.set(devices[0]);
        }
        this.loadingDevices.set(false);
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
    this.closeDeviceDropdown();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { deviceId: device.device_id },
      queryParamsHandling: 'merge',
    });
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

  loadRecentHapticLogs(): void {
    const device = this.selectedDevice();
    if (!device) return;
    this.deviceService.getHapticHistory(device.device_id, 1, 5).subscribe({
      next: (page) => this.recentHapticLogs.set(page?.items ?? []),
      error: () => this.recentHapticLogs.set([]),
    });
  }
}
