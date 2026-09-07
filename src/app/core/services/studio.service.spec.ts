import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { StudioService } from './studio.service';
import { environment } from '../../../environments/environment';
import {
  mockStudioStartRequest,
  mockStudioStartResponse,
  mockStudioSessionReadingsResponse,
} from '../../../testing/mocks/telemetry.mock';

describe('StudioService', () => {
  let service: StudioService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StudioService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(StudioService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should trigger startStudioSession via POST /api/v1/devices/{id}/commands/studio/start', () => {
    service.startStudioSession('hk-device-0001', mockStudioStartRequest).subscribe((res) => {
      expect(res).toEqual(mockStudioStartResponse);
      expect(res.session_id).toBe('sess-abc-12345');
    });

    const req = httpTesting.expectOne(
      `${environment.apiUrl}/api/v1/devices/hk-device-0001/commands/studio/start`
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockStudioStartRequest);
    req.flush(mockStudioStartResponse);
  });

  it('should get session telemetry readings via GET /api/v1/devices/{id}/telemetry?session_id={session_id}', () => {
    service.getSessionReadings('hk-device-0001', 'sess-abc-12345').subscribe((res) => {
      expect(res).toEqual(mockStudioSessionReadingsResponse);
      expect(res.sample_count).toBe(3);
      expect(res.readings.length).toBe(3);
    });

    const req = httpTesting.expectOne(
      `${environment.apiUrl}/api/v1/devices/hk-device-0001/telemetry?session_id=sess-abc-12345`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockStudioSessionReadingsResponse);
  });

  it('should delete session readings via DELETE /api/v1/devices/{id}/telemetry/sessions/{session_id}', () => {
    let deleted = false;
    service.deleteSessionReadings('hk-device-0001', 'sess-abc-12345').subscribe(() => {
      deleted = true;
    });

    const req = httpTesting.expectOne(
      `${environment.apiUrl}/api/v1/devices/hk-device-0001/telemetry/sessions/sess-abc-12345`
    );
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(deleted).toBeTrue();
  });
});

