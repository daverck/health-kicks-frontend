import { TestBed } from '@angular/core/testing';
import { HistoryStore } from './history.store';
import { DeviceService } from '../../core/services/device.service';
import { ToastService } from '../../core/services/toast.service';
import { of, throwError } from 'rxjs';
import {
  mockDevices,
  mockActivityEventPage,
  mockHapticLogPage,
} from '../../../testing/mocks/device.mock';

describe('HistoryStore', () => {
  let store: HistoryStore;
  let deviceServiceSpy: jasmine.SpyObj<DeviceService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    deviceServiceSpy = jasmine.createSpyObj('DeviceService', [
      'listDevices',
      'getActivityEvents',
      'getHapticHistory',
    ]);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['error']);

    deviceServiceSpy.listDevices.and.returnValue(of(mockDevices));
    deviceServiceSpy.getActivityEvents.and.returnValue(of(mockActivityEventPage));
    deviceServiceSpy.getHapticHistory.and.returnValue(of(mockHapticLogPage));

    TestBed.configureTestingModule({
      providers: [
        HistoryStore,
        { provide: DeviceService, useValue: deviceServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    });

    store = TestBed.inject(HistoryStore);
  });

  it('should initialize with default states', () => {
    expect(store.activeTab()).toBe('activities');
    expect(store.page()).toBe(1);
    expect(store.pageSize).toBe(20);
    expect(store.events().length).toBe(0);
    expect(store.hapticLogs().length).toBe(0);
    expect(store.loading()).toBeTrue();
  });

  it('should load devices and automatically load events for the first device', () => {
    store.loadDevices();

    expect(deviceServiceSpy.listDevices).toHaveBeenCalled();
    expect(store.devices().length).toBe(2);
    expect(store.selectedDeviceId()).toBe('hk-device-0001');
    expect(store.selectedDeviceIds()).toEqual(['hk-device-0001']);
    expect(deviceServiceSpy.getActivityEvents).toHaveBeenCalledWith(
      'hk-device-0001',
      1,
      20,
      'all',
      '',
      ''
    );
    expect(store.events().length).toBe(2);
    expect(store.loading()).toBeFalse();
    expect(store.devicesError()).toBeFalse();
  });

  it('should handle device load error and display toast', () => {
    deviceServiceSpy.listDevices.and.returnValue(
      throwError(() => ({ status: 500, message: 'Server error' }))
    );

    store.loadDevices();

    expect(store.devices().length).toBe(0);
    expect(store.devicesError()).toBeTrue();
    expect(store.loading()).toBeFalse();
    expect(toastServiceSpy.error).toHaveBeenCalled();
  });

  it('should switch tabs to haptic and query haptic history', () => {
    store.loadDevices();
    store.setTab('haptic');

    expect(store.activeTab()).toBe('haptic');
    expect(deviceServiceSpy.getHapticHistory).toHaveBeenCalledWith(
      'hk-device-0001',
      1,
      20,
      '',
      ''
    );
    expect(store.hapticLogs().length).toBe(2);
  });

  it('should update dates, reset page, and reload events', () => {
    store.loadDevices();
    store.onDateChange({ startDate: '2026-11-01', endDate: '2026-11-08' });

    expect(store.startDate()).toBe('2026-11-01');
    expect(store.endDate()).toBe('2026-11-08');
    expect(store.page()).toBe(1);
    expect(deviceServiceSpy.getActivityEvents).toHaveBeenCalledWith(
      'hk-device-0001',
      1,
      20,
      'all',
      '2026-11-01',
      '2026-11-08'
    );
  });

  it('should update event types filter and reload events', () => {
    store.loadDevices();
    store.onEventTypesChange(['walk', 'run']);

    expect(store.selectedEventTypes()).toEqual(['walk', 'run']);
    expect(store.selectedEventType()).toBe('walk,run');
    expect(store.page()).toBe(1);
    expect(deviceServiceSpy.getActivityEvents).toHaveBeenCalledWith(
      'hk-device-0001',
      1,
      20,
      'walk,run',
      '',
      ''
    );
  });

  it('should navigate pages for active tab', () => {
    store.loadDevices();
    store.goToPage(3);
    expect(store.page()).toBe(3);

    store.setTab('haptic');
    store.goToPage(2);
    expect(store.hapticPage()).toBe(2);
  });
});
