import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AlertContact,
  AlertContactCreate,
  AlertContactResponse,
  AlertContactsOrderPayload,
  AlertContactTestEmailResponse,
  AlertContactUpdate,
  FallAlertAckInfo,
  FallAlertAckResult,
  FallAlertDetail,
  FallAlertNotification,
  FallAlertNotificationResponse,
  FallAlertSummary,
  PaginatedFallAlertsResponse,
} from '../../models/api.models';

export type {
  AlertContact,
  AlertContactCreate,
  AlertContactResponse,
  AlertContactsOrderPayload,
  AlertContactTestEmailResponse,
  AlertContactUpdate,
  FallAlertAckInfo,
  FallAlertAckResult,
  FallAlertDetail,
  FallAlertNotification,
  FallAlertNotificationResponse,
  FallAlertSummary,
  PaginatedFallAlertsResponse,
};

export interface FallAlertsQuery {
  page?: number;
  pageSize?: number;
  state?: string;
  startDate?: string;
  endDate?: string;
  pseudonym?: string | null;
  userId?: number | string | null;
  user_id?: number | string | null;
}

@Injectable({ providedIn: 'root' })
export class FallAlertService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1`;

  listAlertContacts(): Observable<AlertContactResponse[]> {
    return this.http.get<AlertContactResponse[]>(`${this.base}/users/me/alert-contacts`);
  }

  addAlertContact(payload: AlertContactCreate): Observable<AlertContactResponse> {
    return this.http.post<AlertContactResponse>(`${this.base}/users/me/alert-contacts`, payload);
  }

  createContact(payload: AlertContactCreate): Observable<AlertContactResponse> {
    return this.addAlertContact(payload);
  }

  reorderAlertContacts(
    payload: AlertContactsOrderPayload | number[]
  ): Observable<AlertContactResponse[]> {
    const body: AlertContactsOrderPayload = Array.isArray(payload)
      ? { contact_ids: payload }
      : payload;
    return this.http.put<AlertContactResponse[]>(
      `${this.base}/users/me/alert-contacts/order`,
      body
    );
  }

  updateAlertContact(
    contactId: number | string,
    payload: AlertContactUpdate
  ): Observable<AlertContactResponse> {
    return this.http.patch<AlertContactResponse>(
      `${this.base}/users/me/alert-contacts/${contactId}`,
      payload
    );
  }

  deleteAlertContact(contactId: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/me/alert-contacts/${contactId}`);
  }

  sendTestEmail(contactId: number | string): Observable<AlertContactTestEmailResponse> {
    return this.http.post<AlertContactTestEmailResponse>(
      `${this.base}/users/me/alert-contacts/${contactId}/test-email`,
      {}
    );
  }

  listFallAlerts(query: FallAlertsQuery = {}): Observable<PaginatedFallAlertsResponse> {
    const params: Record<string, string> = {
      page: String(query.page ?? 1),
      page_size: String(query.pageSize ?? 20),
    };

    if (query.state && query.state !== 'all') {
      params['state'] = query.state;
    }
    if (query.startDate) {
      params['start_date'] = query.startDate;
    }
    if (query.endDate) {
      params['end_date'] = query.endDate;
    }
    if (query.pseudonym && query.pseudonym.trim() !== '') {
      params['pseudonym'] = query.pseudonym.trim();
    }
    const targetUserId = query.user_id !== undefined ? query.user_id : query.userId;
    if (targetUserId !== undefined && targetUserId !== null && String(targetUserId).trim() !== '') {
      params['user_id'] = String(targetUserId).trim();
    }

    return this.http.get<PaginatedFallAlertsResponse>(`${this.base}/fall-alerts`, { params });
  }

  listAlerts(query: FallAlertsQuery = {}): Observable<PaginatedFallAlertsResponse> {
    return this.listFallAlerts(query);
  }

  getFallAlertDetail(alertId: number | string): Observable<FallAlertDetail> {
    return this.http.get<FallAlertDetail>(`${this.base}/fall-alerts/${alertId}`);
  }

  /**
   * Safe read-only fetch of alert metadata for emergency contact acknowledgment landing page.
   * Does NOT mutate state (safe against SMS / mail link pre-fetchers).
   */
  getAckInfo(token: string): Observable<FallAlertAckInfo> {
    return this.http.get<FallAlertAckInfo>(`${this.base}/fall-alerts/ack/info`, {
      params: { token },
    });
  }

  /**
   * Explicit user confirmation of alert acknowledgment. Transitions state to ACKNOWLEDGED.
   */
  confirmAck(token: string): Observable<FallAlertAckResult> {
    return this.http.post<FallAlertAckResult>(`${this.base}/fall-alerts/ack`, { token });
  }
}
