import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { DeviceService } from './device.service';
import { environment } from '../../../environments/environment';
import {
  mockDevices,
  mockFallEventPage,
  mockHapticResponse,
  mockHealthResponse,
  mockDeviceCreate,
  mockBoundDevice,
} from '../../../testing/mocks/device.mock';

describe('DeviceService', () => {
  let service: DeviceService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DeviceService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(DeviceService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should list devices via GET /devices with default pagination params', () => {
    service.listDevices().subscribe((devices) => {
      expect(devices.length).toBe(2);
      expect(devices).toEqual(mockDevices);
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/api/v1/devices?skip=0&limit=100`);
    expect(req.request.method).toBe('GET');
    req.flush(mockDevices);
  });

  it('should list devices with custom skip and limit params', () => {
    service.listDevices(10, 25).subscribe();

    const req = httpTesting.expectOne(`${environment.apiUrl}/api/v1/devices?skip=10&limit=25`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should bind a device via POST /devices', () => {
    service.bindDevice(mockDeviceCreate).subscribe((device) => {
      expect(device).toEqual(mockBoundDevice);
      expect(device.bound_at_utc).toBe('2026-09-03T10:15:30Z');
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/api/v1/devices`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockDeviceCreate);
    req.flush(mockBoundDevice);
  });

  it('should unbind a device via DELETE /devices/{device_id}', () => {
    service.unbindDevice('HK-SHOE-001').subscribe();

    const req = httpTesting.expectOne(`${environment.apiUrl}/api/v1/devices/HK-SHOE-001`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('should format specific bind error messages correctly', () => {
    // 404
    expect(service.getBindErrorMessage({ status: 404, error: { detail: 'Device not found' } }))
      .toContain('Identifiant introuvable');

    // 400 already bound
    expect(service.getBindErrorMessage({ status: 400, error: { detail: 'Device already bound to this user' } }))
      .toContain('Cet équipement est déjà associé à votre compte');

    // 400 owned by another
    expect(service.getBindErrorMessage({ status: 400, error: { detail: 'Device is already owned by another user' } }))
      .toContain('Cet équipement est déjà rattaché à un autre compte actif');

    // 401
    expect(service.getBindErrorMessage({ status: 401 }))
      .toContain('Session expirée');

    // Status 0 (network)
    expect(service.getBindErrorMessage({ status: 0 }))
      .toContain('Service temporairement indisponible');

    // Generic fallback
    expect(service.getBindErrorMessage({ status: 500 }))
      .toContain("Une erreur est survenue");
  });

  it('should trigger haptic vibration via POST /devices/{id}/haptic/trigger', () => {
    const payload = { intensity: 180, duration_ms: 500 };
    service.triggerHaptic('hk-device-0001', payload).subscribe((res) => {
      expect(res).toEqual(mockHapticResponse);
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/api/v1/devices/hk-device-0001/haptic/trigger`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockHapticResponse);
  });

  it('should retrieve fall history via GET /devices/{id}/events/falls with pagination', () => {
    service.getFallHistory('hk-device-0001', 2, 20).subscribe((page) => {
      expect(page.items.length).toBe(2);
      expect(page.total).toBe(2);
      expect(page).toEqual(mockFallEventPage);
    });

    const req = httpTesting.expectOne(
      `${environment.apiUrl}/api/v1/devices/hk-device-0001/events/falls?page=2&page_size=20`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockFallEventPage);
  });

  it('should check backend health via GET /health', () => {
    service.health().subscribe((res) => {
      expect(res.status).toBe('healthy');
      expect(res.database).toBe('connected');
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/api/v1/health`);
    expect(req.request.method).toBe('GET');
    req.flush(mockHealthResponse);
  });
});
