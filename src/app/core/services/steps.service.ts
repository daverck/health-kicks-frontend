import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  DailyStepsHistoryResponse,
  DailyStepsSummary,
  HourlyStepsResponse,
} from '../../models/steps.models';

/**
 * Service to manage and retrieve device step count history.
 */
@Injectable({ providedIn: 'root' })
export class StepsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/steps`;

  /**
   * Retrieves historical step counts for a given device.
   * @param deviceId Identifier of the IoT device
   * @param days Number of historical days to fetch (defaults to 30)
   */
  getStepsHistory(deviceId: string, days = 30): Observable<DailyStepsHistoryResponse> {
    const params = new HttpParams()
      .set('device_id', deviceId)
      .set('days', days.toString());

    return this.http.get<DailyStepsHistoryResponse>(`${this.base}/history`, { params });
  }

  /**
   * Retrieves hourly step breakdown for a given device and date.
   * @param deviceId Identifier of the IoT device
   * @param date Date in YYYY-MM-DD format
   */
  getHourlySteps(deviceId: string, date: string): Observable<HourlyStepsResponse> {
    const params = new HttpParams()
      .set('device_id', deviceId)
      .set('date', date);

    return this.http.get<HourlyStepsResponse>(`${this.base}/hourly`, { params });
  }

  /**
   * Retrieves monthly steps summary for a given device, year, and month.
   * @param deviceId Identifier of the IoT device
   * @param year Year (e.g. 2026)
   * @param month Month (1-12)
   */
  getMonthlyStepsSummary(
    deviceId: string,
    year: number,
    month: number
  ): Observable<DailyStepsSummary[]> {
    const monthStr = month < 10 ? `0${month}` : `${month}`;
    const fromDate = `${year}-${monthStr}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const lastDayStr = lastDay < 10 ? `0${lastDay}` : `${lastDay}`;
    const toDate = `${year}-${monthStr}-${lastDayStr}`;

    const params = new HttpParams()
      .set('device_id', deviceId)
      .set('from_date', fromDate)
      .set('to_date', toDate);

    return this.http
      .get<DailyStepsHistoryResponse>(`${this.base}/history`, { params })
      .pipe(map((res) => res.history || []));
  }
}
