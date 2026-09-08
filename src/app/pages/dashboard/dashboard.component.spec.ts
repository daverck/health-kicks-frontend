import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { DeviceService } from '../../core/services/device.service';
import { ToastService } from '../../core/services/toast.service';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import {
  mockDevices,
  mockHapticLogPage,
  mockHapticResponse,
} from '../../../testing/mocks/device.mock';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let deviceServiceSpy: jasmine.SpyObj<DeviceService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    deviceServiceSpy = jasmine.createSpyObj('DeviceService', [
      'listDevices',
      'triggerHaptic',
      'getHapticHistory',
    ]);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    deviceServiceSpy.listDevices.and.returnValue(of(mockDevices));
    deviceServiceSpy.getHapticHistory.and.returnValue(of(mockHapticLogPage));
    deviceServiceSpy.triggerHaptic.and.returnValue(of(mockHapticResponse));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: DeviceService, useValue: deviceServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should load devices and select the first one on init by default', () => {
    fixture.detectChanges(); // triggers ngOnInit

    expect(deviceServiceSpy.listDevices).toHaveBeenCalled();
    expect(component.devices().length).toBe(2);
    expect(component.selectedDevice()).toEqual(mockDevices[0]);
    expect(component.loadingDevices()).toBeFalse();
    expect(component.devicesError()).toBeFalse();
    expect(deviceServiceSpy.getHapticHistory).toHaveBeenCalledWith('hk-device-0001', 1, 5);
    expect(component.recentHapticLogs().length).toBe(2);
  });

  it('should preselect device specified in queryParams', fakeAsync(() => {
    const router = TestBed.inject(Router);
    router.navigate([], { queryParams: { deviceId: 'hk-device-0002' } });
    tick();

    const queryFixture = TestBed.createComponent(DashboardComponent);
    const queryComponent = queryFixture.componentInstance;
    queryFixture.detectChanges();

    expect(queryComponent.selectedDevice()?.device_id).toBe('hk-device-0002');
  }));

  it('should handle error when loading devices fails', () => {
    deviceServiceSpy.listDevices.and.returnValue(
      throwError(() => ({ status: 500 }))
    );

    fixture.detectChanges();

    expect(component.devices()).toEqual([]);
    expect(component.selectedDevice()).toBeNull();
    expect(component.loadingDevices()).toBeFalse();
    expect(component.devicesError()).toBeTrue();
    expect(toastServiceSpy.error).toHaveBeenCalled();
  });

  it('should switch selected device on selectDevice()', () => {
    fixture.detectChanges();

    component.selectDevice(mockDevices[1]);
    expect(component.selectedDevice()).toEqual(mockDevices[1]);
    expect(deviceServiceSpy.getHapticHistory).toHaveBeenCalledWith('hk-device-0002', 1, 5);
  });

  it('should render searchable device select trigger with online status and toggle dropdown', () => {
    fixture.detectChanges();

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('#device-select-trigger');
    expect(trigger).toBeTruthy();
    expect(trigger.textContent).toContain('Bracelet Démo — Marie D.');
    expect(trigger.textContent).toContain('En ligne');
    expect(component.isDeviceDropdownOpen()).toBeFalse();

    trigger.click();
    fixture.detectChanges();

    expect(component.isDeviceDropdownOpen()).toBeTrue();
    const dropdown = fixture.nativeElement.querySelector('[data-testid="device-select-dropdown"]');
    expect(dropdown).toBeTruthy();

    const searchInput: HTMLInputElement = dropdown.querySelector('#device-search-field');
    expect(searchInput).toBeTruthy();
  });

  it('should display online and offline statuses in select options', () => {
    fixture.detectChanges();
    component.toggleDeviceDropdown();
    fixture.detectChanges();

    const dev1Option = fixture.nativeElement.querySelector('[data-testid="device-option-hk-device-0001"]');
    expect(dev1Option).toBeTruthy();
    expect(dev1Option.textContent).toContain('Bracelet Démo — Marie D.');
    expect(dev1Option.textContent).toContain('En ligne');

    const dev2Option = fixture.nativeElement.querySelector('[data-testid="device-option-hk-device-0002"]');
    expect(dev2Option).toBeTruthy();
    expect(dev2Option.textContent).toContain('Bracelet Test — Salle 4');
    expect(dev2Option.textContent).toContain('Hors ligne');
  });

  it('should filter devices based on search query in select dropdown', () => {
    fixture.detectChanges();
    component.toggleDeviceDropdown();
    fixture.detectChanges();

    // Filter matching device 2
    component.deviceSearchQuery.set('Salle 4');
    fixture.detectChanges();
    expect(component.filteredDevices().length).toBe(1);
    expect(component.filteredDevices()[0].device_id).toBe('hk-device-0002');

    // Filter matching device by id
    component.deviceSearchQuery.set('0001');
    fixture.detectChanges();
    expect(component.filteredDevices().length).toBe(1);
    expect(component.filteredDevices()[0].device_id).toBe('hk-device-0001');

    // Filter with no match
    component.deviceSearchQuery.set('nonexistent');
    fixture.detectChanges();
    expect(component.filteredDevices().length).toBe(0);
    const dropdown = fixture.nativeElement.querySelector('[data-testid="device-select-dropdown"]');
    expect(dropdown.textContent).toContain('Aucun équipement trouvé');
  });

  it('should select device and close dropdown on option click', fakeAsync(() => {
    fixture.detectChanges();
    component.toggleDeviceDropdown();
    fixture.detectChanges();

    const dev2Option: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="device-option-hk-device-0002"]');
    dev2Option.click();
    tick();
    fixture.detectChanges();

    expect(component.selectedDevice()?.device_id).toBe('hk-device-0002');
    expect(component.isDeviceDropdownOpen()).toBeFalse();

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('#device-select-trigger');
    expect(trigger.textContent).toContain('Bracelet Test — Salle 4');
    expect(trigger.textContent).toContain('Hors ligne');
  }));

  it('should trigger haptic feedback, refresh haptic history, and display toast on success without displaying json payload', fakeAsync(() => {
    fixture.detectChanges();

    expect(deviceServiceSpy.getHapticHistory).toHaveBeenCalledTimes(1);

    component.triggerHaptic();

    expect(deviceServiceSpy.triggerHaptic).toHaveBeenCalledWith('hk-device-0001', {
      intensity: 184,
      duration_ms: 500,
    });
    expect(component.triggering()).toBeFalse();
    expect(component.vibrating()).toBeTrue();
    expect(toastServiceSpy.success).toHaveBeenCalled();

    // Verify haptic history is refreshed upon trigger success
    expect(deviceServiceSpy.getHapticHistory).toHaveBeenCalledTimes(2);

    // Verify raw JSON response is not rendered in template
    const jsonPayload = fixture.nativeElement.querySelector('.font-mono.text-green-700');
    expect(jsonPayload).toBeNull();

    // After 1200ms, vibrating becomes false
    tick(1200);
    expect(component.vibrating()).toBeFalse();
  }));

  it('should render recent haptic logs list with user level, intensity, duration and formatted date', () => {
    fixture.detectChanges();

    const hapticList = fixture.nativeElement.querySelector('#recent-haptic-list');
    expect(hapticList).toBeTruthy();
    expect(hapticList.textContent).toContain('Niveau 5');
    expect(hapticList.textContent).toContain('180/255');
    expect(hapticList.textContent).toContain('500 ms');
    expect(hapticList.textContent).toContain('Utilisateur');
  });

  it('should not allow triggering haptic feedback when device is offline', () => {
    fixture.detectChanges();

    // Switch to offline device
    component.selectDevice(mockDevices[1]);
    fixture.detectChanges();

    component.triggerHaptic();

    expect(deviceServiceSpy.triggerHaptic).not.toHaveBeenCalled();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('#haptic-trigger-btn');
    expect(button).toBeTruthy();
    expect(button.disabled).toBeTrue();
    expect(button.textContent).toContain('HORS LIGNE');
  });

  it('should handle haptic feedback error and show toast error', () => {
    deviceServiceSpy.triggerHaptic.and.returnValue(
      throwError(() => ({ status: 500, error: { detail: 'Échec matériel' } }))
    );
    fixture.detectChanges();

    component.triggerHaptic();

    expect(component.triggering()).toBeFalse();
    expect(toastServiceSpy.error).toHaveBeenCalledWith('Échec matériel');
  });

  it('should have duration slider configured with 100ms step and 100ms min', () => {
    fixture.detectChanges();

    const durationInput: HTMLInputElement = fixture.nativeElement.querySelector('#duration');
    expect(durationInput).toBeTruthy();
    expect(durationInput.getAttribute('min')).toBe('100');
    expect(durationInput.getAttribute('max')).toBe('10000');
    expect(durationInput.getAttribute('step')).toBe('100');
  });

  it('should render datalists and visual graduations for 10 intensity levels and duration slider', () => {
    fixture.detectChanges();

    const intensityInput: HTMLInputElement = fixture.nativeElement.querySelector('#intensity');
    expect(intensityInput.getAttribute('list')).toBe('intensity-ticks');
    expect(intensityInput.getAttribute('min')).toBe('1');
    expect(intensityInput.getAttribute('max')).toBe('10');
    expect(intensityInput.getAttribute('step')).toBe('1');

    const durationInput: HTMLInputElement = fixture.nativeElement.querySelector('#duration');
    expect(durationInput.getAttribute('list')).toBe('duration-ticks');

    const intensityDatalist = fixture.nativeElement.querySelector('#intensity-ticks');
    expect(intensityDatalist).toBeTruthy();
    expect(intensityDatalist.querySelectorAll('option').length).toBe(10);

    const durationDatalist = fixture.nativeElement.querySelector('#duration-ticks');
    expect(durationDatalist).toBeTruthy();
    expect(durationDatalist.querySelectorAll('option').length).toBe(5);
  });

  it('should accurately convert 10 user vibration levels to truncated 128..255 backend scale', () => {
    fixture.detectChanges();

    component.setVibrationLevel(1);
    expect(component.vibrationLevel()).toBe(1);
    expect(component.intensity()).toBe(128);

    component.setVibrationLevel(5);
    expect(component.vibrationLevel()).toBe(5);
    expect(component.intensity()).toBe(184);

    component.setVibrationLevel(10);
    expect(component.vibrationLevel()).toBe(10);
    expect(component.intensity()).toBe(255);
  });
});

