import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DeviceService } from '../../core/services/device.service';
import { ToastService } from '../../core/services/toast.service';
import { DeviceResponse } from '../../models/api.models';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { DeviceSelectComponent } from '../../shared/components/device-select/device-select.component';
import { StepsHistoryComponent } from '../dashboard/components/steps-history/steps-history.component';

@Component({
  selector: 'app-steps',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslatePipe,
    DeviceSelectComponent,
    StepsHistoryComponent,
  ],
  templateUrl: './steps.component.html',
})
export class StepsComponent implements OnInit {
  private readonly deviceService = inject(DeviceService);
  private readonly toast = inject(ToastService);

  readonly devices = signal<DeviceResponse[]>([]);
  readonly selectedDeviceId = signal<string>('');
  readonly loadingDevices = signal<boolean>(false);
  readonly devicesError = signal<boolean>(false);

  ngOnInit(): void {
    this.loadDevices();
  }

  loadDevices(): void {
    this.loadingDevices.set(true);
    this.devicesError.set(false);

    this.deviceService.listDevices().subscribe({
      next: (devices) => {
        this.devices.set(devices);
        this.loadingDevices.set(false);
        if (devices.length > 0 && !this.selectedDeviceId()) {
          this.selectedDeviceId.set(devices[0].device_id);
        }
      },
      error: (err) => {
        this.devices.set([]);
        this.selectedDeviceId.set('');
        this.loadingDevices.set(false);
        this.devicesError.set(true);
        this.toast.error(
          err?.status === 0
            ? 'Service temporairement indisponible, veuillez vérifier votre connexion.'
            : 'Impossible de charger vos équipements. Veuillez réessayer plus tard.'
        );
      },
    });
  }

  onDeviceSelected(deviceId: string): void {
    this.selectedDeviceId.set(deviceId);
  }
}
