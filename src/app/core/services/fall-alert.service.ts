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
  userId?: number | string | null;
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
    contactId: number,
    payload: AlertContactUpdate
  ): Observable<AlertContactResponse> {
    return this.http.patch<AlertContactResponse>(
      `${this.base}/users/me/alert-contacts/${contactId}`,
      payload
    );
  }

  deleteAlertContact(contactId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/me/alert-contacts/${contactId}`);
  }

  sendTestEmail(contactId: number): Observable<AlertContactTestEmailResponse> {
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
    if (query.userId !== undefined && query.userId !== null && String(query.userId).trim() !== '') {
      params['user_id'] = String(query.userId).trim();
    }

    return this.http.get<PaginatedFallAlertsResponse>(`${this.base}/fall-alerts`, { params });
  }

  getFallAlertDetail(alertId: number): Observable<FallAlertDetail> {
    return this.http.get<FallAlertDetail>(`${this.base}/fall-alerts/${alertId}`);
  }
}
