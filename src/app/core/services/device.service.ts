import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DeviceResponse,
  HealthResponse,
  HapticTrigger,
  HapticTriggerResponse,
  FallEventPage,
} from '../../models/api.models';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1`;

  listDevices(): Observable<DeviceResponse[]> {
    return this.http.get<DeviceResponse[]>(`${this.base}/devices`);
  }

  triggerHaptic(deviceId: string, trigger: HapticTrigger): Observable<HapticTriggerResponse> {
    return this.http.post<HapticTriggerResponse>(
      `${this.base}/devices/${deviceId}/haptic/trigger`,
      trigger
    );
  }

  getFallHistory(deviceId: string, page = 1, pageSize = 50): Observable<FallEventPage> {
    return this.http.get<FallEventPage>(`${this.base}/devices/${deviceId}/events/falls`, {
      params: { page: String(page), page_size: String(pageSize) },
    });
  }

  health(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.base}/health`);
  }
}
