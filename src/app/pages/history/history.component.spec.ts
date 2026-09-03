import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistoryComponent } from './history.component';
import { DeviceService } from '../../core/services/device.service';
import { ToastService } from '../../core/services/toast.service';
import { of, throwError } from 'rxjs';
import {
  mockDevices,
  mockFallEventPage,
  mockFallEvents,
  mockHapticLogPage,
} from '../../../testing/mocks/device.mock';

describe('HistoryComponent', () => {
  let component: HistoryComponent;
  let fixture: ComponentFixture<HistoryComponent>;
  let deviceServiceSpy: jasmine.SpyObj<DeviceService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    deviceServiceSpy = jasmine.createSpyObj('DeviceService', [
      'listDevices',
      'getFallHistory',
      'getHapticHistory',
    ]);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['error']);

    deviceServiceSpy.listDevices.and.returnValue(of(mockDevices));
    deviceServiceSpy.getFallHistory.and.returnValue(of(mockFallEventPage));
    deviceServiceSpy.getHapticHistory.and.returnValue(of(mockHapticLogPage));

    await TestBed.configureTestingModule({
      imports: [HistoryComponent],
      providers: [
        { provide: DeviceService, useValue: deviceServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HistoryComponent);
    component = fixture.componentInstance;
  });

  it('should load devices and fall events on init', () => {
    fixture.detectChanges();

    expect(deviceServiceSpy.listDevices).toHaveBeenCalled();
    expect(component.devices().length).toBe(2);
    expect(component.selectedDeviceId()).toBe('hk-device-0001');
    expect(deviceServiceSpy.getFallHistory).toHaveBeenCalledWith('hk-device-0001', 1, 20);
    expect(component.events().length).toBe(2);
    expect(component.loading()).toBeFalse();
  });

  it('should handle pagination when goToPage is called', () => {
    fixture.detectChanges();

    component.goToPage(2);

    expect(component.page()).toBe(2);
    expect(deviceServiceSpy.getFallHistory).toHaveBeenCalledWith('hk-device-0001', 2, 20);
  });

  it('should handle device selection change', () => {
    fixture.detectChanges();

    const dummyEvent = {
      target: { value: 'hk-device-0002' },
    } as unknown as Event;

    component.onDeviceChange(dummyEvent);

    expect(component.selectedDeviceId()).toBe('hk-device-0002');
    expect(component.page()).toBe(1);
    expect(deviceServiceSpy.getFallHistory).toHaveBeenCalledWith('hk-device-0002', 1, 20);
  });

  it('should handle error when loading fall history fails', () => {
    deviceServiceSpy.getFallHistory.and.returnValue(
      throwError(() => ({ status: 500 }))
    );

    fixture.detectChanges();

    expect(component.events()).toEqual([]);
    expect(component.eventsError()).toBeTrue();
    expect(component.loading()).toBeFalse();
    expect(toastServiceSpy.error).toHaveBeenCalled();
  });

  it('should format source correctly with sourceOf() fallback', () => {
    const defaultEvent = mockFallEvents[0];
    expect(component.sourceOf(defaultEvent)).toBe('imu');

    const customEvent = { ...defaultEvent, source: 'manual' };
    expect(component.sourceOf(customEvent)).toBe('manual');
  });

  it('should switch to haptic tab and load haptic vibration logs', () => {
    fixture.detectChanges();

    component.setTab('haptic');
    fixture.detectChanges();

    expect(component.activeTab()).toBe('haptic');
    expect(deviceServiceSpy.getHapticHistory).toHaveBeenCalledWith('hk-device-0001', 1, 20);
    expect(component.hapticLogs().length).toBe(2);
    expect(component.loading()).toBeFalse();

    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.textContent).toContain('180');
    expect(compiled.textContent).toContain('500 ms');
  });

  it('should handle pagination when on haptic tab', () => {
    fixture.detectChanges();

    component.setTab('haptic');
    component.goToPage(3);

    expect(component.hapticPage()).toBe(3);
    expect(deviceServiceSpy.getHapticHistory).toHaveBeenCalledWith('hk-device-0001', 3, 20);
  });

  it('should handle error when loading haptic history fails', () => {
    deviceServiceSpy.getHapticHistory.and.returnValue(
      throwError(() => ({ status: 500 }))
    );

    fixture.detectChanges();
    component.setTab('haptic');
    fixture.detectChanges();

    expect(component.hapticLogs()).toEqual([]);
    expect(component.eventsError()).toBeTrue();
    expect(component.loading()).toBeFalse();
    expect(toastServiceSpy.error).toHaveBeenCalled();
  });
});

