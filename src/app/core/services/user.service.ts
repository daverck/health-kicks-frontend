import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserResponse, UserUpdate } from '../../models/api.models';

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
}
