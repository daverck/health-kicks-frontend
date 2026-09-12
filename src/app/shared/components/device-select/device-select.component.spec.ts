import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { DeviceSelectComponent } from './device-select.component';
import { DeviceResponse } from '../../../models/api.models';

const mockDevices: DeviceResponse[] = [
  {
    id: 1,
    device_id: 'hk-dev-001',
    name: 'Semelle Gauche Sport',
    status: 'online',
    last_seen_utc: '2026-09-12T10:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    device_id: 'hk-dev-002',
    name: 'Semelle Droite Confort',
    status: 'offline',
    last_seen_utc: '2026-09-10T12:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 3,
    device_id: 'hk-dev-003',
    name: 'Prototype Clinique',
    status: 'online',
    last_seen_utc: '2026-09-12T11:30:00Z',
    created_at: '2026-01-01T00:00:00Z',
  },
];

@Component({
  standalone: true,
  imports: [DeviceSelectComponent],
  template: `
    <app-device-select
      [devices]="devices()"
      [(selectedDeviceId)]="selectedDeviceId"
      [(selectedDevice)]="selectedDevice"
      [onlyOnline]="onlyOnline()"
      [allowAll]="allowAll()"
      [disabled]="disabled()"
      [size]="size()"
      [fullWidth]="fullWidth()"
      (deviceChange)="lastDeviceChange = $event"
      (deviceIdChange)="lastDeviceIdChange = $event"
    />
  `,
})
class HostComponent {
  readonly devices = signal<DeviceResponse[]>(mockDevices);
  readonly selectedDeviceId = signal<string>('');
  readonly selectedDevice = signal<DeviceResponse | null>(null);
  readonly onlyOnline = signal<boolean>(false);
  readonly allowAll = signal<boolean>(false);
  readonly disabled = signal<boolean>(false);
  readonly size = signal<'sm' | 'md'>('md');
  readonly fullWidth = signal<boolean>(false);

  lastDeviceChange: DeviceResponse | null = null;
  lastDeviceIdChange: string = '';
}

describe('DeviceSelectComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let component: DeviceSelectComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, DeviceSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    component = fixture.debugElement.children[0].componentInstance;
  });

  it('should render trigger button with placeholder when no device is selected', () => {
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('#device-select-trigger');
    expect(trigger).toBeTruthy();
    expect(trigger.textContent).toContain('Choisir une semelle');
    expect(component.isOpen()).toBeFalse();
  });

  it('should render selected device details with online status badge and dot', () => {
    host.selectedDeviceId.set('hk-dev-001');
    fixture.detectChanges();

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('#device-select-trigger');
    expect(trigger.textContent).toContain('Semelle Gauche Sport');
    expect(trigger.textContent).toContain('hk-dev-001');
    expect(trigger.textContent).toContain('En ligne');

    // Green online dot
    const onlineDot = trigger.querySelector('.bg-emerald-500');
    expect(onlineDot).toBeTruthy();
  });

  it('should render offline device status correctly', () => {
    host.selectedDeviceId.set('hk-dev-002');
    fixture.detectChanges();

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('#device-select-trigger');
    expect(trigger.textContent).toContain('Semelle Droite Confort');
    expect(trigger.textContent).toContain('hk-dev-002');
    expect(trigger.textContent).toContain('Hors ligne');

    const offlineDot = trigger.querySelector('.bg-gray-400');
    expect(offlineDot).toBeTruthy();
  });

  it('should toggle dropdown open and closed on trigger click', () => {
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('#device-select-trigger');

    trigger.click();
    fixture.detectChanges();
    expect(component.isOpen()).toBeTrue();
    let dropdown = fixture.nativeElement.querySelector('[data-testid="device-select-dropdown"]');
    expect(dropdown).toBeTruthy();

    trigger.click();
    fixture.detectChanges();
    expect(component.isOpen()).toBeFalse();
    dropdown = fixture.nativeElement.querySelector('[data-testid="device-select-dropdown"]');
    expect(dropdown).toBeNull();
  });

  it('should close dropdown when backdrop is clicked', () => {
    component.toggleDropdown();
    fixture.detectChanges();
    expect(component.isOpen()).toBeTrue();

    const backdrop: HTMLDivElement = fixture.nativeElement.querySelector('.fixed.inset-0');
    expect(backdrop).toBeTruthy();
    backdrop.click();
    fixture.detectChanges();

    expect(component.isOpen()).toBeFalse();
  });

  it('should close dropdown when Escape key is pressed', () => {
    component.toggleDropdown();
    fixture.detectChanges();
    expect(component.isOpen()).toBeTrue();

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);
    fixture.detectChanges();

    expect(component.isOpen()).toBeFalse();
  });

  it('should filter device options dynamically based on search query', () => {
    component.toggleDropdown();
    fixture.detectChanges();

    // All 3 devices initially listed
    expect(component.filteredDevices().length).toBe(3);

    // Filter by name
    component.searchQuery.set('Clinique');
    fixture.detectChanges();
    expect(component.filteredDevices().length).toBe(1);
    expect(component.filteredDevices()[0].device_id).toBe('hk-dev-003');

    // Filter by device_id
    component.searchQuery.set('002');
    fixture.detectChanges();
    expect(component.filteredDevices().length).toBe(1);
    expect(component.filteredDevices()[0].device_id).toBe('hk-dev-002');

    // Filter non-existent
    component.searchQuery.set('xyz');
    fixture.detectChanges();
    expect(component.filteredDevices().length).toBe(0);
    const dropdown = fixture.nativeElement.querySelector('[data-testid="device-select-dropdown"]');
    expect(dropdown.textContent).toContain('Aucun équipement trouvé');
  });

  it('should select device on option click, emit events, update models and close dropdown', () => {
    component.toggleDropdown();
    fixture.detectChanges();

    const option: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="device-option-hk-dev-001"]'
    );
    expect(option).toBeTruthy();
    option.click();
    fixture.detectChanges();

    expect(host.selectedDeviceId()).toBe('hk-dev-001');
    expect(host.selectedDevice()?.device_id).toBe('hk-dev-001');
    expect(host.lastDeviceIdChange).toBe('hk-dev-001');
    expect(host.lastDeviceChange?.device_id).toBe('hk-dev-001');
    expect(component.isOpen()).toBeFalse();
  });

  it('should only show online devices when onlyOnline is true', () => {
    host.onlyOnline.set(true);
    fixture.detectChanges();

    component.toggleDropdown();
    fixture.detectChanges();

    // Out of 3 mock devices, 2 are online
    expect(component.availableDevices().length).toBe(2);
    expect(component.filteredDevices().every((d) => d.status === 'online')).toBeTrue();

    const dev2Option = fixture.nativeElement.querySelector('[data-testid="device-option-hk-dev-002"]');
    expect(dev2Option).toBeNull();
  });

  it('should show all devices option when allowAll is true and handle selectAll()', () => {
    host.allowAll.set(true);
    fixture.detectChanges();

    // When empty string is selected, trigger shows All Devices
    expect(component.isAllSelected()).toBeTrue();
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('#device-select-trigger');
    expect(trigger.textContent).toMatch(/Tous les (équipements|appareils)/);

    component.toggleDropdown();
    fixture.detectChanges();

    const allOption: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="device-option-all"]'
    );
    expect(allOption).toBeTruthy();

    // Select a specific device first
    component.selectDevice(mockDevices[0]);
    fixture.detectChanges();
    expect(component.isAllSelected()).toBeFalse();
    expect(host.selectedDeviceId()).toBe('hk-dev-001');

    // Select All Devices again
    component.toggleDropdown();
    fixture.detectChanges();
    const allOptionReopen: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="device-option-all"]'
    );
    allOptionReopen.click();
    fixture.detectChanges();

    expect(component.isAllSelected()).toBeTrue();
    expect(host.selectedDeviceId()).toBe('');
    expect(host.selectedDevice()).toBeNull();
    expect(host.lastDeviceIdChange).toBe('');
    expect(host.lastDeviceChange).toBeNull();
  });

  it('should prevent opening and apply disabled styling when disabled is true', () => {
    host.disabled.set(true);
    fixture.detectChanges();

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('#device-select-trigger');
    expect(trigger.disabled).toBeTrue();

    trigger.click();
    fixture.detectChanges();
    expect(component.isOpen()).toBeFalse();
  });

  it('should apply size sm and fullWidth classes when configured', () => {
    host.size.set('sm');
    host.fullWidth.set(true);
    fixture.detectChanges();

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('#device-select-trigger');
    expect(trigger.classList.contains('px-3')).toBeTrue();
    expect(trigger.classList.contains('py-1.5')).toBeTrue();
    expect(trigger.classList.contains('text-xs')).toBeTrue();
    expect(trigger.classList.contains('w-full')).toBeTrue();
  });
});

