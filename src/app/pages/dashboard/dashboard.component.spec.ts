import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { DeviceService } from '../../core/services/device.service';
import { ToastService } from '../../core/services/toast.service';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import {
  mockDevices,
  mockFallEventPage,
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
      'getFallHistory',
    ]);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    deviceServiceSpy.listDevices.and.returnValue(of(mockDevices));
    deviceServiceSpy.getFallHistory.and.returnValue(of(mockFallEventPage));
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

  it('should load devices and select the first one on init', () => {
    fixture.detectChanges(); // triggers ngOnInit

    expect(deviceServiceSpy.listDevices).toHaveBeenCalled();
    expect(component.devices().length).toBe(2);
    expect(component.selectedDevice()).toEqual(mockDevices[0]);
    expect(component.loadingDevices()).toBeFalse();
    expect(component.devicesError()).toBeFalse();
    expect(deviceServiceSpy.getFallHistory).toHaveBeenCalledWith('hk-device-0001', 1, 5);
    expect(component.recentEvents().length).toBe(2);
  });

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
  });

  it('should trigger haptic feedback and display toast on success without displaying json payload', fakeAsync(() => {
    fixture.detectChanges();

    component.triggerHaptic();

    expect(deviceServiceSpy.triggerHaptic).toHaveBeenCalledWith('hk-device-0001', {
      intensity: 180,
      duration_ms: 500,
    });
    expect(component.triggering()).toBeFalse();
    expect(component.vibrating()).toBeTrue();
    expect(toastServiceSpy.success).toHaveBeenCalled();

    // Verify raw JSON response is not rendered in template
    const jsonPayload = fixture.nativeElement.querySelector('.font-mono.text-green-700');
    expect(jsonPayload).toBeNull();

    // After 1200ms, vibrating becomes false
    tick(1200);
    expect(component.vibrating()).toBeFalse();
  }));

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
});

