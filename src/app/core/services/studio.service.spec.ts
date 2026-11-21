import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { StudioService } from './studio.service';
import { MLModelDetailResponse, MLModelSummaryResponse } from '../../models/telemetry.models';
import { environment } from '../../../environments/environment';
import { mockStudioSessionSummaries } from '../../../testing/mocks/studio-history.mock';
import {
  mockStudioStartRequest,
  mockStudioStartResponse,
  mockStudioSessionReadingsResponse,
  mockStudioDatasetStats,
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

  it('should trim a studio session through PATCH /api/v1/studio/sessions/{id}/trim', () => {
    const updated = { ...mockStudioSessionSummaries[1], duration_sec: 2, sample_count: 200 };

    service.trimSession('sess-002', 1, 3).subscribe((res) => {
      expect(res).toEqual(updated);
    });

    const req = httpTesting.expectOne(
      `${environment.apiUrl}/api/v1/studio/sessions/sess-002/trim`
    );
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ start_offset_sec: 1, end_offset_sec: 3 });
    req.flush(updated);
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

  it('should get studio dataset statistics via GET /api/v1/devices/{id}/studio/stats', () => {
    service.getStudioStats('hk-device-0001').subscribe((res) => {
      expect(res).toEqual(mockStudioDatasetStats);
      expect(res.total_sessions).toBe(mockStudioDatasetStats.total_sessions);
      expect(res.by_label['walk']).toBe(mockStudioDatasetStats.by_label['walk']);
    });

    const req = httpTesting.expectOne(
      `${environment.apiUrl}/api/v1/devices/hk-device-0001/studio/stats`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockStudioDatasetStats);
  });

  it('should get global studio dataset statistics across all captures when deviceId is omitted', () => {
    service.getStudioStats().subscribe((res) => {
      expect(res).toEqual(mockStudioDatasetStats);
      expect(res.total_sessions).toBe(mockStudioDatasetStats.total_sessions);
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/api/v1/studio/stats`);
    expect(req.request.method).toBe('GET');
    req.flush(mockStudioDatasetStats);
  });

  const mockModelsHistory: MLModelSummaryResponse[] = [
    {
      version: 'v1.2.0',
      model_name: 'RandomForest_Standard',
      created_at: '2026-11-20T10:00:00Z',
      is_active: true,
      git_commit: 'a1b2c3d',
      f1_macro: 0.932,
      accuracy: 0.945,
      precision_macro: 0.938,
      recall_macro: 0.927,
      total_sessions: 42,
      total_windows: 1250,
    },
  ];

  const mockModelDetail: MLModelDetailResponse = {
    version: 'v1.2.0',
    model_name: 'RandomForest_Standard',
    created_at: '2026-11-20T10:00:00Z',
    is_active: true,
    git_commit: 'a1b2c3d',
    window_size_sec: 3.0,
    window_step_sec: 0.5,
    flash_usage_pct: 1.25,
    ram_usage_pct: 6.4,
    c_header_size_bytes: 38450,
    metrics: {
      f1_macro: 0.932,
      accuracy: 0.945,
    },
    dataset_summary: {
      total_sessions: 42,
      total_windows: 1250,
    },
  };

  it('should retrieve models history via GET /api/v1/studio/models/history', () => {
    service.getModelsHistory().subscribe((res) => {
      expect(res).toEqual(mockModelsHistory);
      expect(res.length).toBe(1);
      expect(res[0].version).toBe('v1.2.0');
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/api/v1/studio/models/history`);
    expect(req.request.method).toBe('GET');
    req.flush(mockModelsHistory);
  });

  it('should retrieve model version detail via GET /api/v1/studio/models/{version}', () => {
    service.getModelDetail('v1.2.0').subscribe((res) => {
      expect(res).toEqual(mockModelDetail);
      expect(res.version).toBe('v1.2.0');
      expect(res.flash_usage_pct).toBe(1.25);
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/api/v1/studio/models/v1.2.0`);
    expect(req.request.method).toBe('GET');
    req.flush(mockModelDetail);
  });
});
