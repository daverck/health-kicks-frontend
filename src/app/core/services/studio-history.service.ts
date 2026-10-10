import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PaginatedSessionsResponse,
  StudioSessionSummary,
  StudioAuthorSummary,
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
      if (params.label) {
        const val = Array.isArray(params.label)
          ? params.label.filter((l) => l && l !== 'all').join(',')
          : params.label.trim();
        if (val && val !== 'all') {
          httpParams = httpParams.set('label', val);
        }
      }
      if (params.device_id) {
        const val = Array.isArray(params.device_id)
          ? params.device_id.filter((d) => d && d !== 'all').join(',')
          : params.device_id.trim();
        if (val && val !== 'all') {
          httpParams = httpParams.set('device_id', val);
        }
      }
      if (params.user_id !== undefined && params.user_id !== null) {
        const val = Array.isArray(params.user_id)
          ? params.user_id.map(String).filter((u) => u && u !== 'all').join(',')
          : String(params.user_id).trim();
        if (val && val !== 'all') {
          httpParams = httpParams.set('user_id', val);
        }
      }
      if (params.start_date && params.start_date.trim()) {
        httpParams = httpParams.set('start_date', params.start_date.trim());
      }
      if (params.end_date && params.end_date.trim()) {
        httpParams = httpParams.set('end_date', params.end_date.trim());
      }
      if (params.is_validated !== undefined && params.is_validated !== null) {
        httpParams = httpParams.set('is_validated', params.is_validated.toString());
      }
    }

    return this.http.get<PaginatedSessionsResponse>(this.base, { params: httpParams });
  }

  /**
   * Retrieves authors who have recorded studio sessions.
   * GET /api/v1/studio/sessions/authors
   */
  getAuthors(): Observable<StudioAuthorSummary[]> {
    return this.http.get<StudioAuthorSummary[]>(`${this.base}/authors`);
  }

  /**
   * Retrieves high-frequency telemetry IMU readings for a specific studio session from DynamoDB.
   * GET /api/v1/studio/sessions/{sessionId}/readings
   */
  getSessionReadings(sessionId: string): Observable<StudioSessionReadingsResponse> {
    return this.http.get<StudioSessionReadingsResponse>(`${this.base}/${sessionId}/readings`);
  }

  /**
   * Retrieves metadata details for a specific studio session from Aurora PostgreSQL.
   * GET /api/v1/studio/sessions/{sessionId}
   */
  getSession(sessionId: string): Observable<StudioSessionSummary> {
    return this.http.get<StudioSessionSummary>(`${this.base}/${sessionId}`);
  }

  /**
   * Confirms / validates a studio recording session.
   * PATCH /api/v1/studio/sessions/{sessionId}/confirm
   */
  confirmSession(sessionId: string): Observable<StudioSessionSummary> {
    return this.http.patch<StudioSessionSummary>(`${this.base}/${sessionId}/confirm`, {});
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
