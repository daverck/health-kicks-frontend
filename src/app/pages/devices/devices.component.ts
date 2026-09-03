import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DeviceService } from '../../core/services/device.service';
import { ToastService } from '../../core/services/toast.service';
import { DeviceCreate, DeviceResponse } from '../../models/api.models';

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './devices.component.html',
})
export class DevicesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly deviceService = inject(DeviceService);
  private readonly toast = inject(ToastService);

  readonly devices = signal<DeviceResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  // Modal "Ajouter un équipement"
  readonly showAddModal = signal(false);
  readonly submitting = signal(false);
  readonly addError = signal<string | null>(null);

  readonly addForm = this.fb.nonNullable.group({
    device_id: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9_-]+$/)]],
    name: [''],
  });

  // Modal "Dissocier un équipement"
  readonly deviceToUnbind = signal<DeviceResponse | null>(null);
  readonly unbinding = signal(false);

  ngOnInit(): void {
    this.loadDevices();
  }

  loadDevices(): void {
    this.loading.set(true);
    this.error.set(false);

    this.deviceService.listDevices(0, 100).subscribe({
      next: (devices) => {
        this.devices.set(devices);
        this.loading.set(false);
      },
      error: (err) => {
        this.devices.set([]);
        this.loading.set(false);
        this.error.set(true);
        this.toast.error(
          err?.status === 0
            ? 'Service temporairement indisponible, veuillez vérifier votre connexion.'
            : 'Impossible de charger vos équipements. Veuillez réessayer plus tard.'
        );
      },
    });
  }

  // --- Modal Ajout ---
  openAddModal(): void {
    this.addForm.reset({ device_id: '', name: '' });
    this.addError.set(null);
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    if (this.submitting()) return;
    this.showAddModal.set(false);
    this.addError.set(null);
  }

  onAddSubmit(): void {
    if (this.addForm.invalid || this.submitting()) {
      this.addForm.markAllAsTouched();
      return;
    }

    const { device_id, name } = this.addForm.getRawValue();
    const payload: DeviceCreate = {
      device_id: device_id.trim().toUpperCase(),
      name: name.trim() ? name.trim() : null,
    };

    this.submitting.set(true);
    this.addError.set(null);

    this.deviceService.bindDevice(payload).subscribe({
      next: (created) => {
        this.submitting.set(false);
        this.showAddModal.set(false);
        this.addForm.reset();
        this.toast.success(`L'équipement ${created.name || created.device_id} a été associé avec succès !`);
        this.loadDevices();
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = this.deviceService.getBindErrorMessage(err);
        this.addError.set(msg);
      },
    });
  }

  // --- Modal Dissociation ---
  openUnbindModal(device: DeviceResponse): void {
    this.deviceToUnbind.set(device);
  }

  closeUnbindModal(): void {
    if (this.unbinding()) return;
    this.deviceToUnbind.set(null);
  }

  confirmUnbind(): void {
    const device = this.deviceToUnbind();
    if (!device || this.unbinding()) return;

    this.unbinding.set(true);

    this.deviceService.unbindDevice(device.device_id).subscribe({
      next: () => {
        this.unbinding.set(false);
        this.deviceToUnbind.set(null);
        this.toast.success(`L'équipement ${device.name || device.device_id} a été dissocié.`);
        this.loadDevices();
      },
      error: (err) => {
        this.unbinding.set(false);
        this.toast.error(
          err?.status === 404
            ? 'Cet équipement n’était plus associé à votre compte.'
            : 'Impossible de dissocier cet équipement. Veuillez réessayer.'
        );
      },
    });
  }
}
