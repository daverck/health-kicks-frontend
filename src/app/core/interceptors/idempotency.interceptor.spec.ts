import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpHeaders, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { idempotencyInterceptor, isIdempotentTargetRequest } from './idempotency.interceptor';
import { environment } from '../../../environments/environment';

describe('idempotencyInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([idempotencyInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('attaches Idempotency-Key header on mutating Fall Alert, Contact, and Studio requests', () => {
    const targetEndpoints = [
      { method: 'POST', url: `${apiUrl}/api/v1/fall-alerts/ack` },
      { method: 'POST', url: `${apiUrl}/api/v1/users/me/alert-contacts` },
      { method: 'PUT', url: `${apiUrl}/api/v1/users/me/alert-contacts/order` },
      { method: 'PATCH', url: `${apiUrl}/api/v1/studio/sessions/123e4567/confirm` },
      { method: 'POST', url: `${apiUrl}/api/v1/devices/HK-1/commands/studio/start` },
    ];

    for (const ep of targetEndpoints) {
      http.request(ep.method, ep.url, { body: {} }).subscribe();
      const req = httpMock.expectOne(ep.url);
      expect(req.request.headers.has('Idempotency-Key')).toBe(true);
      expect(req.request.headers.get('Idempotency-Key')?.length).toBeGreaterThan(8);
      req.flush({});
    }
  });

  it('preserves caller-supplied Idempotency-Key header for retries', () => {
    const url = `${apiUrl}/api/v1/users/me/alert-contacts`;
    const customHeaders = new HttpHeaders({ 'Idempotency-Key': 'custom-retry-key-001' });

    http.post(url, { first_name: 'Alice' }, { headers: customHeaders }).subscribe();
    const req = httpMock.expectOne(url);
    expect(req.request.headers.get('Idempotency-Key')).toBe('custom-retry-key-001');
    req.flush({});
  });

  it('does not attach Idempotency-Key on GET or DELETE requests', () => {
    const getUrl = `${apiUrl}/api/v1/fall-alerts`;
    const deleteUrl = `${apiUrl}/api/v1/studio/sessions/123e4567`;

    http.get(getUrl).subscribe();
    const getReq = httpMock.expectOne(getUrl);
    expect(getReq.request.headers.has('Idempotency-Key')).toBe(false);
    getReq.flush({});

    http.delete(deleteUrl).subscribe();
    const delReq = httpMock.expectOne(deleteUrl);
    expect(delReq.request.headers.has('Idempotency-Key')).toBe(false);
    delReq.flush({});
  });

  it('matches only target API routes via isIdempotentTargetRequest', () => {
    expect(isIdempotentTargetRequest('POST', `${apiUrl}/api/v1/fall-alerts/ack`)).toBe(true);
    expect(isIdempotentTargetRequest('GET', `${apiUrl}/api/v1/fall-alerts/ack`)).toBe(false);
    expect(isIdempotentTargetRequest('POST', 'https://external.example.com/api/v1/fall-alerts/ack')).toBe(false);
  });
});
