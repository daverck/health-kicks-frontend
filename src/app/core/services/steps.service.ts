import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DailyStepsHistoryResponse } from '../../models/steps.models';

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
}

