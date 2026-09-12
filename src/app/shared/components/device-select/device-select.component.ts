import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeviceResponse } from '../../../models/api.models';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-device-select',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './device-select.component.html',
})
export class DeviceSelectComponent implements OnInit {
  private readonly elementRef = inject(ElementRef);

  // Inputs & Two-way models
  readonly devices = input<DeviceResponse[]>([]);
  readonly selectedDeviceId = model<string>('');
  readonly selectedDevice = model<DeviceResponse | null>(null);

  readonly onlyOnline = input<boolean>(false);
  readonly allowAll = input<boolean>(false);
  readonly allLabel = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly size = input<'sm' | 'md'>('md');
  readonly fullWidth = input<boolean>(false);
  readonly placeholder = input<string>('');
  readonly triggerId = input<string>('device-select-trigger');
  readonly autoSelectFirst = input<boolean>(false);

  // Outputs
  readonly deviceChange = output<DeviceResponse | null>();
  readonly deviceIdChange = output<string>();

  // Internal state
  readonly isOpen = signal<boolean>(false);
  readonly searchQuery = signal<string>('');

  constructor() {
    // Keep selectedDevice and selectedDeviceId synchronized
    effect(() => {
      const id = this.selectedDeviceId();
      const all = this.devices();
      if (id) {
        const found = all.find((d) => d.device_id === id) ?? null;
        if (found && this.selectedDevice()?.device_id !== found.device_id) {
          this.selectedDevice.set(found);
        }
      } else if (!this.allowAll() && all.length > 0 && this.autoSelectFirst() && !this.selectedDevice()) {
        const first = this.onlyOnline()
          ? all.find((d) => d.status === 'online') ?? all[0]
          : all[0];
        if (first) {
          this.selectDevice(first);
        }
      }
    });

    effect(() => {
      const dev = this.selectedDevice();
      if (dev && this.selectedDeviceId() !== dev.device_id) {
        this.selectedDeviceId.set(dev.device_id);
      }
    });
  }

  ngOnInit(): void {
    if (this.autoSelectFirst() && !this.selectedDeviceId() && !this.allowAll()) {
      const list = this.availableDevices();
      if (list.length > 0) {
        this.selectDevice(list[0]);
      }
    }
  }

  // Filtered devices based on onlyOnline flag
  readonly availableDevices = computed<DeviceResponse[]>(() => {
    const list = this.devices();
    if (this.onlyOnline()) {
      return list.filter((d) => d.status === 'online');
    }
    return list;
  });

  // Filtered devices based on user search query
  readonly filteredDevices = computed<DeviceResponse[]>(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const list = this.availableDevices();
    if (!query) {
      return list;
    }
    return list.filter(
      (d) =>
        (d.name || '').toLowerCase().includes(query) ||
        d.device_id.toLowerCase().includes(query)
    );
  });

  // Active selected device resolution
  readonly currentDevice = computed<DeviceResponse | null>(() => {
    const dev = this.selectedDevice();
    if (dev) return dev;
    const id = this.selectedDeviceId();
    if (!id) return null;
    return this.devices().find((d) => d.device_id === id) ?? null;
  });

  readonly isAllSelected = computed<boolean>(() => {
    return this.allowAll() && !this.selectedDeviceId() && !this.selectedDevice();
  });

  readonly triggerSizeClasses = computed<string>(() => {
    return this.size() === 'sm'
      ? 'rounded-lg px-3 py-1.5 text-xs'
      : 'rounded-xl px-4 py-3 text-sm';
  });

  toggleDropdown(): void {
    if (this.disabled()) return;
    this.isOpen.update((open) => !open);
    if (!this.isOpen()) {
      this.searchQuery.set('');
    }
  }

  closeDropdown(): void {
    this.isOpen.set(false);
    this.searchQuery.set('');
  }

  selectDevice(device: DeviceResponse): void {
    this.selectedDevice.set(device);
    this.selectedDeviceId.set(device.device_id);
    this.deviceChange.emit(device);
    this.deviceIdChange.emit(device.device_id);
    this.closeDropdown();
  }

  selectAll(): void {
    if (!this.allowAll()) return;
    this.selectedDevice.set(null);
    this.selectedDeviceId.set('');
    this.deviceChange.emit(null);
    this.deviceIdChange.emit('');
    this.closeDropdown();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.closeDropdown();
    }
  }
}

