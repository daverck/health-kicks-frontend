import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { StudioComponent } from './studio.component';
import { DeviceService } from '../../core/services/device.service';
import { StudioService } from '../../core/services/studio.service';
import { ToastService } from '../../core/services/toast.service';
import { mockDevices } from '../../../testing/mocks/device.mock';
import {
  mockStudioStartResponse,
  mockStudioSessionReadingsResponse,
  mockImuReadings,
} from '../../../testing/mocks/telemetry.mock';

describe('StudioComponent', () => {
  let component: StudioComponent;
  let fixture: ComponentFixture<StudioComponent>;
  let deviceServiceSpy: jasmine.SpyObj<DeviceService>;
  let studioServiceSpy: jasmine.SpyObj<StudioService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
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
  });

  it('should create and load devices on init', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(deviceServiceSpy.listDevices).toHaveBeenCalled();
    expect(component.devices()).toEqual(mockDevices);
    expect(component.selectedDeviceId()).toBe('hk-device-0001');
    expect(component.state()).toBe('idle');
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
});
