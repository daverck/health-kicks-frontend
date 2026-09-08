import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { StudioHistoryService } from './studio-history.service';
import { environment } from '../../../environments/environment';
import {
  mockPaginatedSessionsResponse,
  mockStudioSessionSummaries,
} from '../../../testing/mocks/studio-history.mock';
import { mockStudioSessionReadingsResponse } from '../../../testing/mocks/telemetry.mock';

describe('StudioHistoryService', () => {
  let service: StudioHistoryService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1/studio/sessions`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StudioHistoryService],
    });
    service = TestBed.inject(StudioHistoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get sessions without params', () => {
    service.getSessions().subscribe((res) => {
      expect(res).toEqual(mockPaginatedSessionsResponse);
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush(mockPaginatedSessionsResponse);
  });

  it('should get sessions with filter and pagination params', () => {
    service
      .getSessions({
        page: 2,
        size: 10,
        label: 'fall_forward',
        device_id: 'hk-device-0001',
        user_id: 42,
      })
      .subscribe((res) => {
        expect(res).toEqual(mockPaginatedSessionsResponse);
      });

    const req = httpMock.expectOne((r) => r.url === baseUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('10');
    expect(req.request.params.get('label')).toBe('fall_forward');
    expect(req.request.params.get('device_id')).toBe('hk-device-0001');
    expect(req.request.params.get('user_id')).toBe('42');
    req.flush(mockPaginatedSessionsResponse);
  });

  it('should get session readings by session id', () => {
    service.getSessionReadings('sess-001').subscribe((res) => {
      expect(res).toEqual(mockStudioSessionReadingsResponse);
    });

    const req = httpMock.expectOne(`${baseUrl}/sess-001/readings`);
    expect(req.request.method).toBe('GET');
    req.flush(mockStudioSessionReadingsResponse);
  });

  it('should update session label', () => {
    const updated = { ...mockStudioSessionSummaries[0], label: 'run' };

    service.updateSessionLabel('sess-001', 'run').subscribe((res) => {
      expect(res).toEqual(updated);
    });

    const req = httpMock.expectOne(`${baseUrl}/sess-001`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ label: 'run' });
    req.flush(updated);
  });

  it('should delete session and handle 204 No Content', () => {
    service.deleteSession('sess-001').subscribe((res) => {
      expect(res).toBeNull();
    });

    const req = httpMock.expectOne(`${baseUrl}/sess-001`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
