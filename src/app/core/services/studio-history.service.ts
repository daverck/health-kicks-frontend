import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PaginatedSessionsResponse,
  StudioSessionSummary,
  StudioHistoryFilterParams,
  StudioSessionUpdatePayload,
} from '../../models/studio-history.model';
import { StudioSessionReadingsResponse } from '../../models/telemetry.models';

@Injectable({ providedIn: 'root' })
export class StudioHistoryService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/studio/sessions`;

  /**
   * Retrieves a paginated list of studio recording sessions with optional filtering.
   * GET /api/v1/studio/sessions
   */
  getSessions(params?: StudioHistoryFilterParams): Observable<PaginatedSessionsResponse> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page !== undefined && params.page !== null) {
        httpParams = httpParams.set('page', params.page.toString());
      }
      if (params.size !== undefined && params.size !== null) {
        httpParams = httpParams.set('size', params.size.toString());
      }
      if (params.label && params.label.trim()) {
        httpParams = httpParams.set('label', params.label.trim());
      }
      if (params.device_id && params.device_id.trim()) {
        httpParams = httpParams.set('device_id', params.device_id.trim());
      }
      if (params.user_id !== undefined && params.user_id !== null) {
        httpParams = httpParams.set('user_id', params.user_id.toString());
      }
      if (params.start_date && params.start_date.trim()) {
        httpParams = httpParams.set('start_date', params.start_date.trim());
      }
      if (params.end_date && params.end_date.trim()) {
        httpParams = httpParams.set('end_date', params.end_date.trim());
      }
    }

    return this.http.get<PaginatedSessionsResponse>(this.base, { params: httpParams });
  }

  /**
   * Retrieves high-frequency telemetry IMU readings for a specific studio session from DynamoDB.
   * GET /api/v1/studio/sessions/{sessionId}/readings
   */
  getSessionReadings(sessionId: string): Observable<StudioSessionReadingsResponse> {
    return this.http.get<StudioSessionReadingsResponse>(`${this.base}/${sessionId}/readings`);
  }

  /**
   * Updates the movement label for an existing recording session.
   * PATCH /api/v1/studio/sessions/{sessionId}
   */
  updateSessionLabel(sessionId: string, newLabel: string): Observable<StudioSessionSummary> {
    const payload: StudioSessionUpdatePayload = { label: newLabel };
    return this.http.patch<StudioSessionSummary>(`${this.base}/${sessionId}`, payload);
  }

  /**
   * Deletes a recording session from PostgreSQL and removes its telemetry readings from DynamoDB.
   * DELETE /api/v1/studio/sessions/{sessionId} (HTTP 204)
   */
  deleteSession(sessionId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${sessionId}`);
  }
}
