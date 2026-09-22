import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { StepsService } from './steps.service';
import { environment } from '../../../environments/environment';
import { DailyStepsHistoryResponse } from '../../models/steps.models';

describe('StepsService', () => {
  let service: StepsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StepsService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(StepsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch steps history with query parameters', () => {
    const mockResponse: DailyStepsHistoryResponse = {
      device_id: 'HK-SHOE-001',
      from_date: '2026-08-23',
      to_date: '2026-09-22',
      history: [
        {
          date: '2026-09-22',
          total_steps: 6325,
          by_activity: { walk: 4120, run: 1850, stairs: 310, unclassified: 45 },
        },
      ],
    };

    service.getStepsHistory('HK-SHOE-001', 30).subscribe((res) => {
      expect(res).toEqual(mockResponse);
      expect(res.history[0].total_steps).toBe(6325);
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiUrl}/api/v1/steps/history` &&
        r.params.get('device_id') === 'HK-SHOE-001' &&
        r.params.get('days') === '30'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});

