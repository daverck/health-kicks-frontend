import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StepsComponent } from './steps.component';
import { DeviceService } from '../../core/services/device.service';
import { ToastService } from '../../core/services/toast.service';
import { StepsService } from '../../core/services/steps.service';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { mockDevices } from '../../../testing/mocks/device.mock';

describe('StepsComponent', () => {
  let component: StepsComponent;
  let fixture: ComponentFixture<StepsComponent>;
  let deviceServiceSpy: jasmine.SpyObj<DeviceService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let stepsServiceSpy: jasmine.SpyObj<StepsService>;

  beforeEach(async () => {
    deviceServiceSpy = jasmine.createSpyObj('DeviceService', ['listDevices']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['error', 'success']);
    stepsServiceSpy = jasmine.createSpyObj('StepsService', ['getStepsHistory']);

    deviceServiceSpy.listDevices.and.returnValue(of(mockDevices));
    stepsServiceSpy.getStepsHistory.and.returnValue(
      of({
        device_id: 'hk-device-0001',
        from_date: '2026-09-01',
        to_date: '2026-09-22',
        history: [],
      })
    );

    await TestBed.configureTestingModule({
      imports: [StepsComponent],
      providers: [
        provideRouter([]),
        { provide: DeviceService, useValue: deviceServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: StepsService, useValue: stepsServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StepsComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load devices and auto-select the first device on init', () => {
    fixture.detectChanges();

    expect(deviceServiceSpy.listDevices).toHaveBeenCalled();
    expect(component.devices().length).toBe(2);
    expect(component.selectedDeviceId()).toBe('hk-device-0001');
    expect(component.loadingDevices()).toBeFalse();
    expect(component.devicesError()).toBeFalse();

    const historyComponent = fixture.nativeElement.querySelector('app-steps-history');
    expect(historyComponent).toBeTruthy();
  });

  it('should switch selected device on onDeviceSelected()', () => {
    fixture.detectChanges();

    component.onDeviceSelected('hk-device-0002');
    expect(component.selectedDeviceId()).toBe('hk-device-0002');
  });

  it('should handle error when loading devices fails', () => {
    deviceServiceSpy.listDevices.and.returnValue(throwError(() => ({ status: 500 })));

    fixture.detectChanges();

    expect(component.devices()).toEqual([]);
    expect(component.selectedDeviceId()).toBe('');
    expect(component.loadingDevices()).toBeFalse();
    expect(component.devicesError()).toBeTrue();
    expect(toastServiceSpy.error).toHaveBeenCalled();

    const errorContainer = fixture.nativeElement.querySelector('.border-red-200');
    expect(errorContainer).toBeTruthy();
  });

  it('should display empty state when user has no devices', () => {
    deviceServiceSpy.listDevices.and.returnValue(of([]));

    fixture.detectChanges();

    expect(component.devices().length).toBe(0);
    expect(component.selectedDeviceId()).toBe('');
    expect(component.loadingDevices()).toBeFalse();
    expect(component.devicesError()).toBeFalse();

    const emptyState = fixture.nativeElement.querySelector('.border-dashed');
    expect(emptyState).toBeTruthy();
  });
});
