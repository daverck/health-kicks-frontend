import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpParams, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { mockDataInterceptor, resetMockDataSessions } from './mock-data.interceptor';
import {
  PaginatedSessionsResponse,
  StudioAuthorSummary,
  StudioSessionSummary,
} from '../../models/studio-history.model';
import { DeviceResponse } from '../../models/api.models';
import { StudioDatasetStats, StudioSessionReadingsResponse } from '../../models/telemetry.models';

describe('mockDataInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  const initialMockData = environment.mockData;

  beforeEach(() => {
    (environment as { mockData?: boolean }).mockData = true;
    resetMockDataSessions();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([mockDataInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    (environment as { mockData?: boolean }).mockData = initialMockData;
    resetMockDataSessions();
    httpTesting.verify();
  });

  it('passes requests through when mockData is disabled', () => {
    (environment as { mockData?: boolean }).mockData = false;

    http.get(`${environment.apiUrl}/api/v1/studio/sessions`).subscribe();

    const req = httpTesting.expectOne(`${environment.apiUrl}/api/v1/studio/sessions`);
    req.flush({ items: [], total: 0 });
  });

  it('returns mock paginated studio sessions', () => {
    let result: PaginatedSessionsResponse | undefined;

    http
      .get<PaginatedSessionsResponse>(`${environment.apiUrl}/api/v1/studio/sessions`, {
        params: new HttpParams().set('page', '1').set('size', '5'),
      })
      .subscribe((res) => (result = res));

    expect(result).toBeDefined();
    expect(result?.items.length).toBe(5);
    expect(result?.page).toBe(1);
    expect(result?.size).toBe(5);
    expect(result?.total).toBeGreaterThanOrEqual(10);
    expect(result?.items[0].device_id).toBeDefined();
  });

  it('filters sessions by label and validation status', () => {
    let result: PaginatedSessionsResponse | undefined;

    http
      .get<PaginatedSessionsResponse>(`${environment.apiUrl}/api/v1/studio/sessions`, {
        params: new HttpParams()
          .set('label', 'walk')
          .set('is_validated', 'true'),
      })
      .subscribe((res) => (result = res));

    expect(result).toBeDefined();
    expect(result?.items.every((s) => s.label === 'walk' && s.is_validated)).toBe(true);
  });

  it('filters sessions by device_id and hitl status', () => {
    let result: PaginatedSessionsResponse | undefined;

    http
      .get<PaginatedSessionsResponse>(`${environment.apiUrl}/api/v1/studio/sessions`, {
        params: new HttpParams()
          .set('device_id', 'hk-device-0001')
          .set('is_hitl', 'false'),
      })
      .subscribe((res) => (result = res));

    expect(result).toBeDefined();
    expect(result?.items.every((s) => s.device_id === 'hk-device-0001' && !s.is_hitl)).toBe(true);
  });

  it('filters sessions by classification (edge_ai vs research)', () => {
    let edgeAiResult: PaginatedSessionsResponse | undefined;
    let researchResult: PaginatedSessionsResponse | undefined;

    http
      .get<PaginatedSessionsResponse>(`${environment.apiUrl}/api/v1/studio/sessions`, {
        params: new HttpParams().set('classification', 'edge_ai'),
      })
      .subscribe((res) => (edgeAiResult = res));

    http
      .get<PaginatedSessionsResponse>(`${environment.apiUrl}/api/v1/studio/sessions`, {
        params: new HttpParams().set('classification', 'research'),
      })
      .subscribe((res) => (researchResult = res));

    expect(edgeAiResult).toBeDefined();
    expect(researchResult).toBeDefined();
    expect(edgeAiResult?.items.length).toBeGreaterThan(0);
    expect(researchResult?.items.some((s) => s.label === 'squats' || s.label === 'jumping_jacks')).toBe(true);
  });

  it('filters sessions by sample count and duration ranges', () => {
    let result: PaginatedSessionsResponse | undefined;

    http
      .get<PaginatedSessionsResponse>(`${environment.apiUrl}/api/v1/studio/sessions`, {
        params: new HttpParams()
          .set('sample_count_min', '400')
          .set('sample_count_max', '600')
          .set('duration_sec_min', '4')
          .set('duration_sec_max', '6'),
      })
      .subscribe((res) => (result = res));

    expect(result).toBeDefined();
    expect(
      result?.items.every(
        (s) => s.sample_count >= 400 && s.sample_count <= 600 && s.duration_sec >= 4 && s.duration_sec <= 6
      )
    ).toBe(true);
  });

  it('returns distinct authors list for GET /api/v1/studio/sessions/authors', () => {
    let authors: StudioAuthorSummary[] | undefined;

    http
      .get<StudioAuthorSummary[]>(`${environment.apiUrl}/api/v1/studio/sessions/authors`)
      .subscribe((res) => (authors = res));

    expect(authors).toBeDefined();
    expect(authors?.length).toBeGreaterThanOrEqual(2);
    expect(authors?.some((a) => a.email === 'serckdavid@gmail.com')).toBe(true);
  });

  it('returns session details and readings', () => {
    let session: StudioSessionSummary | undefined;
    let readings: StudioSessionReadingsResponse | undefined;

    http
      .get<StudioSessionSummary>(`${environment.apiUrl}/api/v1/studio/sessions/sess-dev-001`)
      .subscribe((res) => (session = res));

    http
      .get<StudioSessionReadingsResponse>(
        `${environment.apiUrl}/api/v1/studio/sessions/sess-dev-001/readings`
      )
      .subscribe((res) => (readings = res));

    expect(session).toBeDefined();
    expect(session?.uuid).toBe('sess-dev-001');
    expect(readings).toBeDefined();
    expect(readings?.session_id).toBe('sess-dev-001');
    expect(readings?.readings.length).toBeGreaterThan(0);
    expect(readings?.readings[0].ax).toBeDefined();
  });

  it('confirms and validates a session via PATCH /confirm', () => {
    let updated: StudioSessionSummary | undefined;

    http
      .patch<StudioSessionSummary>(
        `${environment.apiUrl}/api/v1/studio/sessions/sess-dev-002/confirm`,
        {}
      )
      .subscribe((res) => (updated = res));

    expect(updated).toBeDefined();
    expect(updated?.uuid).toBe('sess-dev-002');
    expect(updated?.is_validated).toBe(true);
  });

  it('updates session label and validation via generic PATCH', () => {
    let updated: StudioSessionSummary | undefined;

    http
      .patch<StudioSessionSummary>(
        `${environment.apiUrl}/api/v1/studio/sessions/sess-dev-001`,
        { label: 'run', is_validated: false }
      )
      .subscribe((res) => (updated = res));

    expect(updated).toBeDefined();
    expect(updated?.label).toBe('run');
    expect(updated?.is_validated).toBe(false);
  });

  it('deletes session via DELETE', () => {
    let deleted = false;

    http
      .delete<void>(`${environment.apiUrl}/api/v1/studio/sessions/sess-dev-001`)
      .subscribe(() => (deleted = true));

    expect(deleted).toBe(true);

    let getResult: StudioSessionSummary | undefined;
    let errorStatus: number | undefined;

    http
      .get<StudioSessionSummary>(`${environment.apiUrl}/api/v1/studio/sessions/sess-dev-001`)
      .subscribe({
        next: (res) => (getResult = res),
        error: (err) => (errorStatus = err.status),
      });

    expect(getResult).toBeUndefined();
    expect(errorStatus).toBe(404);
  });

  it('returns mock devices list for GET /api/v1/devices', () => {
    let devices: DeviceResponse[] | undefined;

    http
      .get<DeviceResponse[]>(`${environment.apiUrl}/api/v1/devices`)
      .subscribe((res) => (devices = res));

    expect(devices).toBeDefined();
    expect(devices?.length).toBeGreaterThanOrEqual(3);
    expect(devices?.[0].device_id).toBe('hk-device-0001');
  });

  it('returns studio dataset stats for GET /studio/stats', () => {
    let stats: StudioDatasetStats | undefined;

    http
      .get<StudioDatasetStats>(`${environment.apiUrl}/api/v1/studio/stats`)
      .subscribe((res) => (stats = res));

    expect(stats).toBeDefined();
    expect(stats?.total_sessions).toBeGreaterThan(0);
    expect(stats?.edge_ai_labels.includes('walk')).toBe(true);
  });
});
