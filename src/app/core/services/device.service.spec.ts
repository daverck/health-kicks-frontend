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

  it('should list devices via GET /devices', () => {
    service.listDevices().subscribe((devices) => {
      expect(devices.length).toBe(2);
      expect(devices).toEqual(mockDevices);
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/api/v1/devices`);
    expect(req.request.method).toBe('GET');
    req.flush(mockDevices);
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

