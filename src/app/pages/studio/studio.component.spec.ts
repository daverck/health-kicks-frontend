import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { StudioComponent } from './studio.component';
import { DeviceService } from '../../core/services/device.service';
import { StudioService } from '../../core/services/studio.service';
import { ToastService } from '../../core/services/toast.service';
import { mockDevices } from '../../../testing/mocks/device.mock';
import { DeviceResponse } from '../../models/api.models';
import {
  mockStudioStartResponse,
  mockStudioSessionReadingsResponse,
  mockImuReadings,
} from '../../../testing/mocks/telemetry.mock';

const mockOnlineDevices: DeviceResponse[] = mockDevices.map((d) => ({
  ...d,
  status: 'online',
}));

describe('StudioComponent', () => {
  let component: StudioComponent;
  let fixture: ComponentFixture<StudioComponent>;
  let deviceServiceSpy: jasmine.SpyObj<DeviceService>;
  let studioServiceSpy: jasmine.SpyObj<StudioService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    localStorage.clear();
    deviceServiceSpy = jasmine.createSpyObj('DeviceService', ['listDevices']);
    deviceServiceSpy.listDevices.and.returnValue(of(mockDevices));

    studioServiceSpy = jasmine.createSpyObj('StudioService', [
      'startStudioSession',
      'getSessionReadings',
      'deleteSessionReadings',
    ]);
    studioServiceSpy.startStudioSession.and.returnValue(of(mockStudioStartResponse));
    studioServiceSpy.getSessionReadings.and.returnValue(of(mockStudioSessionReadingsResponse));
    studioServiceSpy.deleteSessionReadings.and.returnValue(of(undefined));

    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'info', 'warning']);

    await TestBed.configureTestingModule({
      imports: [StudioComponent],
      providers: [
        { provide: DeviceService, useValue: deviceServiceSpy },
        { provide: StudioService, useValue: studioServiceSpy },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StudioComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    component.ngOnDestroy();
    localStorage.clear();
  });

  it('should create and load devices on init, pre-selecting the first online device when localStorage is empty', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(deviceServiceSpy.listDevices).toHaveBeenCalled();
    expect(component.devices()).toEqual(mockDevices);
    expect(component.selectedDeviceId()).toBe('hk-device-0001');
    expect(localStorage.getItem('healthkicks_selected_device_id')).toBe('hk-device-0001');
    expect(component.selectedDevice()).toEqual(mockDevices[0]);
    expect(component.state()).toBe('idle');
  });

  it('should filter out offline devices from onlineDevices computed signal', () => {
    fixture.detectChanges();

    expect(component.devices().length).toBe(2);
    expect(component.onlineDevices().length).toBe(1);
    expect(component.onlineDevices()[0].device_id).toBe('hk-device-0001');
    expect(component.onlineDevices()[0].status).toBe('online');
  });

  it('should fallback to first online device if device saved in localStorage is offline', () => {
    localStorage.setItem('healthkicks_selected_device_id', 'hk-device-0002');

    fixture.detectChanges();

    expect(component.selectedDeviceId()).toBe('hk-device-0001');
    expect(component.selectedDevice()?.device_id).toBe('hk-device-0001');
  });

  it('should pre-select device saved in localStorage if present and online', () => {
    deviceServiceSpy.listDevices.and.returnValue(of(mockOnlineDevices));
    localStorage.setItem('healthkicks_selected_device_id', 'hk-device-0002');

    fixture = TestBed.createComponent(StudioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.selectedDeviceId()).toBe('hk-device-0002');
    expect(component.selectedDevice()?.device_id).toBe('hk-device-0002');
  });

  it('should update selectedDeviceId, save to localStorage and call startStudioSession with selected online device', () => {
    deviceServiceSpy.listDevices.and.returnValue(of(mockOnlineDevices));
    fixture = TestBed.createComponent(StudioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Select second device (HK-2)
    component.onDeviceSelect('hk-device-0002');
    expect(component.selectedDeviceId()).toBe('hk-device-0002');
    expect(localStorage.getItem('healthkicks_selected_device_id')).toBe('hk-device-0002');
    expect(component.selectedDevice()?.device_id).toBe('hk-device-0002');

    // Launch capture
    component.startCapture();

    expect(studioServiceSpy.startStudioSession).toHaveBeenCalledWith('hk-device-0002', jasmine.objectContaining({
      label: 'walk',
      duration_sec: 5,
    }));
    expect(component.state()).toBe('countdown');
  });

  it('should prevent startSession if selected device is offline and show toast error', () => {
    fixture.detectChanges();

    component.selectedDeviceId.set('hk-device-0002'); // offline in mockDevices
    component.startSession();

    expect(toastSpy.error).toHaveBeenCalledWith("L'équipement sélectionné n'est pas en ligne. Veuillez choisir une semelle connectée.");
    expect(studioServiceSpy.startStudioSession).not.toHaveBeenCalled();
    expect(component.state()).toBe('idle');
  });

  it('should filter online devices via autocomplete search query', () => {
    deviceServiceSpy.listDevices.and.returnValue(of(mockOnlineDevices));
    fixture = TestBed.createComponent(StudioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.filteredOnlineDevices().length).toBe(2);

    // Search by name
    component.deviceSearchQuery.set('Marie');
    expect(component.filteredOnlineDevices().length).toBe(1);
    expect(component.filteredOnlineDevices()[0].device_id).toBe('hk-device-0001');

    // Search by device_id
    component.deviceSearchQuery.set('0002');
    expect(component.filteredOnlineDevices().length).toBe(1);
    expect(component.filteredOnlineDevices()[0].device_id).toBe('hk-device-0002');

    // Search non-matching
    component.deviceSearchQuery.set('inexistant');
    expect(component.filteredOnlineDevices().length).toBe(0);
  });

  it('should toggle, open, and close device dropdown and select via selectDevice()', () => {
    deviceServiceSpy.listDevices.and.returnValue(of(mockOnlineDevices));
    fixture = TestBed.createComponent(StudioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isDeviceDropdownOpen()).toBeFalse();

    component.toggleDeviceDropdown();
    expect(component.isDeviceDropdownOpen()).toBeTrue();

    component.closeDeviceDropdown();
    expect(component.isDeviceDropdownOpen()).toBeFalse();

    component.openDeviceDropdown();
    expect(component.isDeviceDropdownOpen()).toBeTrue();

    component.deviceSearchQuery.set('test');
    component.selectDevice('hk-device-0002');
    expect(component.selectedDeviceId()).toBe('hk-device-0002');
    expect(component.isDeviceDropdownOpen()).toBeFalse();
    expect(component.deviceSearchQuery()).toBe('');
  });

  it('should not allow opening device dropdown when not in idle state', () => {
    fixture.detectChanges();
    component.state.set('recording');

    component.openDeviceDropdown();
    expect(component.isDeviceDropdownOpen()).toBeFalse();

    component.toggleDeviceDropdown();
    expect(component.isDeviceDropdownOpen()).toBeFalse();
  });

  it('should render a single searchable device select button and apply green styling to "Prêt" badge in idle state', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const selectBtn = compiled.querySelector('#device-select-btn');
    expect(selectBtn).toBeTruthy();

    // Verify there is only one device select control (no native select)
    const nativeSelect = compiled.querySelector('#device-select');
    expect(nativeSelect).toBeNull();

    // Verify "Prêt" badge is green
    const statusBadge = compiled.querySelector('.rounded-full.font-bold');
    expect(statusBadge?.classList.contains('bg-green-100')).toBeTrue();
    expect(statusBadge?.classList.contains('text-green-800')).toBeTrue();

    // Verify dot is green
    const statusDot = statusBadge?.querySelector('span');
    expect(statusDot?.classList.contains('bg-green-500')).toBeTrue();
  });

  it('should compute effectiveLabel accurately with predefined and custom labels', () => {
    fixture.detectChanges();

    // Default label is walk
    expect(component.effectiveLabel()).toBe('walk');

    // Select another predefined label
    component.selectLabel('fall_forward');
    expect(component.effectiveLabel()).toBe('fall_forward');

    // Custom label overrides predefined
    component.customLabel.set('  escalier_rapide  ');
    expect(component.effectiveLabel()).toBe('escalier_rapide');

    // Resetting custom label restores predefined
    component.customLabel.set('');
    expect(component.effectiveLabel()).toBe('fall_forward');
  });

  it('should handle device loading error gracefully', () => {
    deviceServiceSpy.listDevices.and.returnValue(
      throwError(() => ({ status: 500, error: { detail: 'Erreur serveur' } }))
    );

    component.loadDevices();

    expect(component.devicesError()).toBeTrue();
    expect(toastSpy.error).toHaveBeenCalled();
  });

  it('should execute full capture workflow: start -> countdown -> recording -> fetching -> inspecting', fakeAsync(() => {
    fixture.detectChanges();

    component.startSession();

    expect(studioServiceSpy.startStudioSession).toHaveBeenCalledWith('hk-device-0001', {
      label: 'walk',
      duration_sec: 5,
      pulse_count: 3,
      pulse_duration_ms: 100,
      pulse_pause_ms: 200,
      pulse_intensity: 220,
    });
    expect(component.state()).toBe('countdown');

    // Fast-forward countdown duration (1500 ms)
    tick(1500);
    expect(component.state()).toBe('recording');

    // Fast-forward recording duration (5000 ms)
    tick(5000);

    // Fetching calls getSessionReadings and transitions to inspecting
    expect(studioServiceSpy.getSessionReadings).toHaveBeenCalledWith('hk-device-0001', 'sess-abc-12345');
    expect(component.state()).toBe('inspecting');
    expect(component.readings()).toEqual(mockImuReadings);
    expect(toastSpy.success).toHaveBeenCalledWith(jasmine.stringMatching(/Télémétrie récupérée/));
  }));

  it('should retry fetching with 800ms delay when initial response is empty', fakeAsync(() => {
    fixture.detectChanges();
    component.selectedDeviceId.set('hk-device-0001');
    component.currentSession.set(mockStudioStartResponse);

    // First call returns empty, second returns readings
    studioServiceSpy.getSessionReadings.and.returnValues(
      of({ device_id: 'hk-device-0001', session_id: 'sess-abc-12345', sample_count: 0, readings: [] }),
      of(mockStudioSessionReadingsResponse)
    );

    component.runFetching();
    expect(component.state()).toBe('fetching');
    expect(component.fetchingAttempt()).toBe(1);

    // Advance 800ms for retry
    tick(800);
    expect(studioServiceSpy.getSessionReadings).toHaveBeenCalledTimes(2);
    expect(component.fetchingAttempt()).toBe(2);
    expect(component.state()).toBe('inspecting');
    expect(component.readings()).toEqual(mockImuReadings);
  }));

  it('should validate session and reset to idle state', () => {
    fixture.detectChanges();
    component.state.set('inspecting');
    component.readings.set(mockImuReadings);

    component.validateSession();

    expect(toastSpy.success).toHaveBeenCalledWith('Session IMU validée et archivée avec succès !');
    expect(component.state()).toBe('idle');
    expect(component.readings().length).toBe(0);
  });

  it('should reject session, call deleteSessionReadings and reset to idle state', () => {
    fixture.detectChanges();
    component.currentSession.set(mockStudioStartResponse);
    component.selectedDeviceId.set('hk-device-0001');
    component.state.set('inspecting');

    component.rejectSession();

    expect(studioServiceSpy.deleteSessionReadings).toHaveBeenCalledWith('hk-device-0001', 'sess-abc-12345');
    expect(toastSpy.info).toHaveBeenCalledWith('Session rejetée et points supprimés de DynamoDB.');
    expect(component.state()).toBe('idle');
  });
  it('should show error when starting session without selected device', () => {
    fixture.detectChanges();
    component.selectedDeviceId.set('');

    component.startSession();

    expect(toastSpy.error).toHaveBeenCalledWith('Veuillez sélectionner un équipement avant de lancer une session.');
    expect(studioServiceSpy.startStudioSession).not.toHaveBeenCalled();
  });

  it('should reset to idle state and clear timers when calling resetToIdle()', () => {
    fixture.detectChanges();
    component.state.set('countdown');
    component.resetToIdle();
    expect(component.state()).toBe('idle');

    component.state.set('recording');
    component.resetToIdle();
    expect(component.state()).toBe('idle');

    component.state.set('fetching');
    component.resetToIdle();
    expect(component.state()).toBe('idle');

    component.state.set('inspecting');
    component.resetToIdle();
    expect(component.state()).toBe('idle');
  });
});


