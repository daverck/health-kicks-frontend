import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DeviceCreate,
  DeviceResponse,
  HealthResponse,
  HapticTrigger,
  HapticTriggerResponse,
  HapticLogPage,
  FallEventPage,
} from '../../models/api.models';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1`;

  listDevices(skip = 0, limit = 100): Observable<DeviceResponse[]> {
    return this.http.get<DeviceResponse[]>(`${this.base}/devices`, {
      params: { skip: String(skip), limit: String(limit) },
    });
  }

  bindDevice(payload: DeviceCreate): Observable<DeviceResponse> {
    return this.http.post<DeviceResponse>(`${this.base}/devices`, payload);
  }

  unbindDevice(deviceId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/devices/${deviceId}`);
  }

  getBindErrorMessage(err: unknown): string {
    const error = err as { status?: number; error?: { detail?: string } };
    const detail = typeof error?.error?.detail === 'string' ? error.error.detail.toLowerCase() : '';

    if (error?.status === 404 || detail.includes('not found')) {
      return 'Identifiant introuvable. Veuillez vérifier le code figurant sous votre semelle ou sur son emballage.';
    }
    if (error?.status === 400) {
      if (detail.includes('already bound') || detail.includes('already bound to this user')) {
        return 'Cet équipement est déjà associé à votre compte.';
      }
      if (detail.includes('already owned') || detail.includes('owned by another user')) {
        return "Cet équipement est déjà rattaché à un autre compte actif. S'il s'agit d'un appareil d'occasion, il pourra être rattaché automatiquement après 30 jours consécutifs sans activité de son précédent propriétaire.";
      }
      if (error?.error?.detail) {
        return error.error.detail;
      }
    }
    if (error?.status === 401) {
      return 'Session expirée. Veuillez vous reconnecter.';
    }
    if (error?.status === 0) {
      return 'Service temporairement indisponible, veuillez vérifier votre connexion.';
    }
    return "Une erreur est survenue lors de l'association de l'équipement.";
  }

  triggerHaptic(deviceId: string, trigger: HapticTrigger): Observable<HapticTriggerResponse> {
    return this.http.post<HapticTriggerResponse>(
      `${this.base}/devices/${deviceId}/haptic/trigger`,
      trigger
    );
  }

  getHapticHistory(deviceId: string, page = 1, pageSize = 20): Observable<HapticLogPage> {
    return this.http.get<HapticLogPage>(`${this.base}/devices/${deviceId}/haptic/history`, {
      params: { page: String(page), page_size: String(pageSize) },
    });
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
