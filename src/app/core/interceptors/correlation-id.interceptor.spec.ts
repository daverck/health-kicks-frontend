import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { correlationIdInterceptor, generateCorrelationId } from './correlation-id.interceptor';
import { environment } from '../../../environments/environment';

describe('correlationIdInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([correlationIdInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('generateCorrelationId returns a non-empty string', () => {
    const id = generateCorrelationId();
    expect(id).toBeTruthy();
    expect(id.length).toBeGreaterThanOrEqual(16);
  });

  it('attaches X-Correlation-ID to backend API requests', () => {
    http.get(`${environment.apiUrl}/api/v1/health`).subscribe();

    const req = httpTesting.expectOne(`${environment.apiUrl}/api/v1/health`);
    expect(req.request.headers.has('X-Correlation-ID')).toBeTrue();
    const correlationId = req.request.headers.get('X-Correlation-ID');
    expect(correlationId).toBeTruthy();
    expect(correlationId!.length).toBeGreaterThanOrEqual(16);
    req.flush({ status: 'ok' });
  });

  it('preserves existing X-Correlation-ID if already supplied', () => {
    http.get(`${environment.apiUrl}/api/v1/health`, {
      headers: { 'X-Correlation-ID': 'custom-cid-123' },
    }).subscribe();

    const req = httpTesting.expectOne(`${environment.apiUrl}/api/v1/health`);
    expect(req.request.headers.get('X-Correlation-ID')).toBe('custom-cid-123');
    req.flush({ status: 'ok' });
  });

  it('does not attach X-Correlation-ID to non-API external requests', () => {
    http.get('https://external-api.com/data').subscribe();

    const req = httpTesting.expectOne('https://external-api.com/data');
    expect(req.request.headers.has('X-Correlation-ID')).toBeFalse();
    req.flush({});
  });
});

