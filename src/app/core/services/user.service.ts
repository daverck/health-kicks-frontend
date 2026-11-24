import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserResponse, UserUpdate } from '../../models/api.models';
import { createZipArchive } from '../utils/export.utils';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1`;

  me(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.base}/auth/me`);
  }

  updateUser(userUuid: string, payload: UserUpdate): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.base}/users/${userUuid}`, payload);
  }

  /** Local profile update (name/email) — falls back to PATCH /users/{user_uuid}. */
  updateProfile(userUuid: string, payload: { name?: string; email?: string }): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.base}/users/${userUuid}`, payload);
  }

  /**
   * Delete user account permanently (GDPR right to erasure / App Store compliance).
   * If userUuid is provided, deletes specific user (admin capability);
   * otherwise deletes the authenticated user's account (/users/me).
   * Returns HTTP 204 No Content.
   */
  deleteAccount(userUuid?: string): Observable<void> {
    const url = userUuid
      ? `${this.base}/users/${encodeURIComponent(userUuid)}`
      : `${this.base}/users/me`;
    return this.http.delete<void>(url);
  }

  /**
   * Export all user data under GDPR Article 20 Right to Data Portability.
   * In local development with mockAuth, generates a structured client-side export Blob.
   * In production, sends POST /api/v1/users/me/export returning the backend ZIP archive.
   */
  exportData(): Observable<Blob> {
    if (environment.mockAuth) {
      const mockUserData = {
        export_version: '1.0',
        exported_at: new Date().toISOString(),
        user: environment.mockUser,
        note: 'HealthKicks GDPR Article 20 Personal Data Export (Dev Mock Archive)',
        devices: [],
        step_metrics: [],
        fall_alerts: [],
      };
      const zipBlob = createZipArchive([
        {
          filename: 'user_profile.json',
          content: JSON.stringify(environment.mockUser, null, 2),
        },
        {
          filename: 'gdpr_data_export.json',
          content: JSON.stringify(mockUserData, null, 2),
        },
      ]);
      return of(zipBlob);
    }
    return this.http.post(`${this.base}/users/me/export`, {}, {
      responseType: 'blob',
    });
  }
}
