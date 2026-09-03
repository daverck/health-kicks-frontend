import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DevicesComponent } from './devices.component';
import { DeviceService } from '../../core/services/device.service';
import { ToastService } from '../../core/services/toast.service';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import {
  mockDevices,
  mockBoundDevice,
  mockDeviceCreate,
} from '../../../testing/mocks/device.mock';

describe('DevicesComponent', () => {
  let component: DevicesComponent;
  let fixture: ComponentFixture<DevicesComponent>;
  let deviceServiceSpy: jasmine.SpyObj<DeviceService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    deviceServiceSpy = jasmine.createSpyObj('DeviceService', [
      'listDevices',
      'bindDevice',
      'unbindDevice',
      'getBindErrorMessage',
    ]);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);

    deviceServiceSpy.listDevices.and.returnValue(of(mockDevices));
    deviceServiceSpy.bindDevice.and.returnValue(of(mockBoundDevice));
    deviceServiceSpy.unbindDevice.and.returnValue(of(undefined));
    deviceServiceSpy.getBindErrorMessage.and.callFake((err: any) => {
      if (err?.status === 404) return 'Identifiant introuvable. Veuillez vérifier le code figurant sous votre semelle.';
      if (err?.status === 400) return 'Cet équipement est déjà associé à votre compte.';
      return 'Une erreur est survenue.';
    });

    await TestBed.configureTestingModule({
      imports: [DevicesComponent],
      providers: [
        provideRouter([]),
        { provide: DeviceService, useValue: deviceServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DevicesComponent);
    component = fixture.componentInstance;
  });

  it('should create the component and load devices on init', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(deviceServiceSpy.listDevices).toHaveBeenCalledWith(0, 100);
    expect(component.devices().length).toBe(2);
    expect(component.loading()).toBeFalse();
    expect(component.error()).toBeFalse();
  });

  it('should handle error when loading devices fails', () => {
    deviceServiceSpy.listDevices.and.returnValue(throwError(() => ({ status: 500 })));

    fixture.detectChanges();

    expect(component.devices()).toEqual([]);
    expect(component.loading()).toBeFalse();
    expect(component.error()).toBeTrue();
    expect(toastServiceSpy.error).toHaveBeenCalled();
  });

  it('should open and close the add device modal', () => {
    fixture.detectChanges();
    expect(component.showAddModal()).toBeFalse();

    component.openAddModal();
    expect(component.showAddModal()).toBeTrue();
    expect(component.addForm.value.device_id).toBe('');

    component.closeAddModal();
    expect(component.showAddModal()).toBeFalse();
  });

  it('should not submit add form if required device_id is invalid', () => {
    fixture.detectChanges();
    component.openAddModal();

    component.onAddSubmit();

    expect(deviceServiceSpy.bindDevice).not.toHaveBeenCalled();
    expect(component.addForm.controls.device_id.touched).toBeTrue();
  });

  it('should successfully bind device, show toast and refresh list', () => {
    fixture.detectChanges();
    component.openAddModal();

    component.addForm.setValue({
      device_id: 'HK-SHOE-001',
      name: 'Semelle Pied Droit',
    });

    component.onAddSubmit();

    expect(deviceServiceSpy.bindDevice).toHaveBeenCalledWith({
      device_id: 'HK-SHOE-001',
      name: 'Semelle Pied Droit',
    });
    expect(toastServiceSpy.success).toHaveBeenCalledWith(
      "L'équipement Semelle Pied Droit a été associé avec succès !"
    );
    expect(component.showAddModal()).toBeFalse();
    expect(component.submitting()).toBeFalse();
  });

  it('should handle bind error and display contextual error message in modal', () => {
    fixture.detectChanges();
    component.openAddModal();

    deviceServiceSpy.bindDevice.and.returnValue(
      throwError(() => ({ status: 404, error: { detail: 'Device not found' } }))
    );

    component.addForm.setValue({
      device_id: 'UNKNOWN-ID',
      name: '',
    });

    component.onAddSubmit();

    expect(component.submitting()).toBeFalse();
    expect(component.showAddModal()).toBeTrue();
    expect(component.addError()).toContain('Identifiant introuvable');
  });

  it('should open and close unbind confirmation modal', () => {
    fixture.detectChanges();
    expect(component.deviceToUnbind()).toBeNull();

    component.openUnbindModal(mockDevices[0]);
    expect(component.deviceToUnbind()).toEqual(mockDevices[0]);

    component.closeUnbindModal();
    expect(component.deviceToUnbind()).toBeNull();
  });

  it('should successfully unbind device, show toast and refresh list', () => {
    fixture.detectChanges();
    component.openUnbindModal(mockDevices[0]);

    component.confirmUnbind();

    expect(deviceServiceSpy.unbindDevice).toHaveBeenCalledWith(mockDevices[0].device_id);
    expect(toastServiceSpy.success).toHaveBeenCalledWith(
      `L'équipement ${mockDevices[0].name} a été dissocié.`
    );
    expect(component.deviceToUnbind()).toBeNull();
    expect(component.unbinding()).toBeFalse();
  });

  it('should handle unbind error and show toast error', () => {
    fixture.detectChanges();
    component.openUnbindModal(mockDevices[0]);

    deviceServiceSpy.unbindDevice.and.returnValue(
      throwError(() => ({ status: 500 }))
    );

    component.confirmUnbind();

    expect(component.unbinding()).toBeFalse();
    expect(toastServiceSpy.error).toHaveBeenCalled();
  });
});

