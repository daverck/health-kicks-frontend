import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  StudioStartRequest,
  StudioStartResponse,
  StudioSessionReadingsResponse,
  StudioDatasetStats,
} from '../../models/telemetry.models';

export type { StudioDatasetStats };

@Injectable({ providedIn: 'root' })
export class StudioService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1`;

  /**
   * Triggers a studio capture session with haptic countdown pulses on the device.
   * POST /api/v1/devices/{device_id}/commands/studio/start
   */
  startStudioSession(deviceId: string, request: StudioStartRequest): Observable<StudioStartResponse> {
    return this.http.post<StudioStartResponse>(
      `${this.base}/devices/${deviceId}/commands/studio/start`,
      request
    );
  }

  /**
   * Retrieves telemetry IMU readings recorded during a studio session.
   * GET /api/v1/devices/{device_id}/telemetry?session_id={session_id}
   */
  getSessionReadings(deviceId: string, sessionId: string): Observable<StudioSessionReadingsResponse> {
    return this.http.get<StudioSessionReadingsResponse>(
      `${this.base}/devices/${deviceId}/telemetry`,
      { params: { session_id: sessionId } }
    );
  }

  /**
   * Deletes session telemetry readings from DynamoDB when an experiment is rejected.
   * DELETE /api/v1/devices/{device_id}/telemetry/sessions/{session_id}
   */
  deleteSessionReadings(deviceId: string, sessionId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/devices/${deviceId}/telemetry/sessions/${sessionId}`
    );
  }

  /**
   * Retrieves dataset summary statistics for a specific device, or across all devices/captures if deviceId is omitted.
   * GET /api/v1/devices/{device_id}/studio/stats
   * GET /api/v1/studio/stats
   */
  getStudioStats(deviceId?: string): Observable<StudioDatasetStats> {
    const url = deviceId
      ? `${this.base}/devices/${deviceId}/studio/stats`
      : `${this.base}/studio/stats`;
    return this.http.get<StudioDatasetStats>(url);
  }
}

