import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { StepsService } from './steps.service';
import { environment } from '../../../environments/environment';
import {
  DailyStepsHistoryResponse,
  HourlyStepsResponse,
} from '../../models/steps.models';

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

  it('should fetch hourly steps with device_id and date parameters', () => {
    const mockHourlyResponse: HourlyStepsResponse = {
      device_id: 'HK-SHOE-001',
      date: '2026-10-06',
      hourly_data: [
        { hour: 8, total_steps: 450, by_activity: { walk: 400, stairs: 50 } },
        { hour: 9, total_steps: 1200, by_activity: { walk: 1000, run: 200 } },
      ],
    };

    service.getHourlySteps('HK-SHOE-001', '2026-10-06').subscribe((res) => {
      expect(res).toEqual(mockHourlyResponse);
      expect(res.hourly_data.length).toBe(2);
      expect(res.hourly_data[0].total_steps).toBe(450);
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiUrl}/api/v1/steps/hourly` &&
        r.params.get('device_id') === 'HK-SHOE-001' &&
        r.params.get('date') === '2026-10-06'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockHourlyResponse);
  });

  it('should fetch monthly steps summary for the given month and year', () => {
    const mockHistoryResponse: DailyStepsHistoryResponse = {
      device_id: 'HK-SHOE-001',
      from_date: '2026-10-01',
      to_date: '2026-10-31',
      history: [
        {
          date: '2026-10-01',
          total_steps: 7500,
          by_activity: { walk: 5000, run: 2000, stairs: 500 },
        },
        {
          date: '2026-10-02',
          total_steps: 8200,
          by_activity: { walk: 6000, run: 2200 },
        },
      ],
    };

    service.getMonthlyStepsSummary('HK-SHOE-001', 2026, 10).subscribe((summary) => {
      expect(summary.length).toBe(2);
      expect(summary[0].date).toBe('2026-10-01');
      expect(summary[0].total_steps).toBe(7500);
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiUrl}/api/v1/steps/history` &&
        r.params.get('device_id') === 'HK-SHOE-001' &&
        r.params.get('from_date') === '2026-10-01' &&
        r.params.get('to_date') === '2026-10-31'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockHistoryResponse);
  });

  it('should return empty array if res.history is null or undefined in getMonthlyStepsSummary', () => {
    const mockEmptyResponse: any = {
      device_id: 'HK-SHOE-001',
      from_date: '2026-02-01',
      to_date: '2026-02-28',
    };

    service.getMonthlyStepsSummary('HK-SHOE-001', 2026, 2).subscribe((summary) => {
      expect(summary).toEqual([]);
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiUrl}/api/v1/steps/history` &&
        r.params.get('device_id') === 'HK-SHOE-001' &&
        r.params.get('from_date') === '2026-02-01' &&
        r.params.get('to_date') === '2026-02-28'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockEmptyResponse);
  });
});
