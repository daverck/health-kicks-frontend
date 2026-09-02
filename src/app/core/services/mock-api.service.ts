import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  HapticTrigger,
  HapticTriggerResponse,
  DeviceResponse,
  FallEventPage,
  FallEventResponse,
} from '../models/api.models';
import { environment } from '../../../environments/environment';

/**
 * Reusable service for backend endpoints that may not be implemented yet
 * (e.g. /devices/{id}/events/falls). Falls back to mocked data when the
 * API call fails or `useMocks` is enabled.
 */
@Injectable({ providedIn: 'root' })
export class MockApiService {
  /** Flip to false once the backend endpoints are live. */
  readonly useMocks = new BehaviorSubject<boolean>(true);
  readonly useMocks$ = this.useMocks.asObservable();

  constructor() {}

  toggleMocks(): void {
    this.useMocks.next(!this.useMocks.value);
  }

  /** Try the real endpoint, fall back to mocks on any error. */
  getFallHistory(deviceId: string, page = 1, pageSize = 50): Observable<FallEventPage> {
    return new Observable<FallEventPage>((observer) => {
      const url = `${environment.apiUrl}/api/v1/devices/${deviceId}/events/falls?page=${page}&page_size=${pageSize}`;
      fetch(url, {
        headers: { Accept: 'application/json' },
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data: FallEventPage) => {
          this.useMocks.next(false);
          observer.next(data);
          observer.complete();
        })
        .catch(() => {
          this.useMocks.next(true);
          observer.next(this.mockFallHistory(deviceId, page, pageSize));
          observer.complete();
        });
    });
  }

  /** Simulate a haptic trigger when the backend device is offline. */
  mockHapticTrigger(trigger: HapticTrigger): HapticTriggerResponse {
    return {
      status: 'mocked',
      device_id: 'hk-device-0001',
      intensity: trigger.intensity,
      duration_ms: trigger.duration_ms ?? 500,
    };
  }

  mockFallHistory(deviceId: string, page: number, pageSize: number): FallEventPage {
    const statuses = ['fall_detected', 'vibration_sent', 'acknowledged', 'false_positive'];
    const sources = ['imu', 'manual', 'auto_alert'];
    const items: FallEventResponse[] = Array.from({ length: pageSize }, (_, i) => {
      const n = (page - 1) * pageSize + i + 1;
      const ts = new Date(Date.now() - n * 3_600_000 * (1 + (i % 5))).toISOString();
      return {
        id: n,
        device_id: deviceId,
        timestamp_utc: ts,
        confidence_score: Math.round((0.55 + Math.random() * 0.44) * 100) / 100,
        raw_imu_json: { ax: +Math.random().toFixed(3), ay: +Math.random().toFixed(3), az: +Math.random().toFixed(3) },
        status_enum: statuses[n % statuses.length],
        // extra display-only fields (mock)
        source: sources[n % sources.length],
      } as FallEventResponse;
    });
    return { items, page, page_size: pageSize, total: 137 };
  }

  mockDevices(): DeviceResponse[] {
    const now = new Date().toISOString();
    return [
      {
        id: 1,
        device_id: 'hk-device-0001',
        name: 'Bracelet Démo — Marie D.',
        status: 'online',
        last_seen_utc: now,
        created_at: '2025-11-02T09:00:00Z',
      },
      {
        id: 2,
        device_id: 'hk-device-0002',
        name: 'Bracelet Test — Salle 4',
        status: 'offline',
        last_seen_utc: '2026-08-30T14:12:00Z',
        created_at: '2025-12-15T11:30:00Z',
      },
    ];
  }
}
