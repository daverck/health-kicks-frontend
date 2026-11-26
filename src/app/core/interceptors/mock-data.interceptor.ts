import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PaginatedSessionsResponse,
  StudioAuthorSummary,
  StudioSessionSummary,
} from '../../models/studio-history.model';
import { isEdgeAiActivity } from '../../models/studio.model';
import {
  DEV_STUDIO_DATASET_STATS,
  INITIAL_DEV_DEVICES,
  INITIAL_DEV_STUDIO_SESSIONS,
  generateMockSessionReadings,
} from '../mocks/mock-studio-data';

let activeSessions: StudioSessionSummary[] = [...INITIAL_DEV_STUDIO_SESSIONS];

/**
 * Resets the in-memory mock session store to its initial state.
 * Useful for automated tests or local reset workflows.
 */
export function resetMockDataSessions(): void {
  activeSessions = [...INITIAL_DEV_STUDIO_SESSIONS];
}

/**
 * Intercepts HTTP requests in local mock development mode (`environment.mockData = true`).
 * Provides realistic responses for studio sessions, devices, authors, and telemetry.
 */
export const mockDataInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.mockData) {
    return next(req);
  }

  const url = req.url;

  // 1. Studio Sessions & Inspection Telemetry
  if (url.includes('/api/v1/studio/sessions')) {
    const urlWithoutQuery = url.split('?')[0];

    // Authors list: GET /api/v1/studio/sessions/authors
    if (urlWithoutQuery.endsWith('/authors') && req.method === 'GET') {
      const authorsMap = new Map<string, StudioAuthorSummary>();
      for (const s of activeSessions) {
        if (s.author_uuid) {
          authorsMap.set(s.author_uuid, {
            author_uuid: s.author_uuid,
            author_pseudonym: s.author_pseudonym,
            email: s.user_email ?? '',
            is_pseudonymized: s.is_pseudonymized ?? false,
          });
        }
      }
      return of(new HttpResponse({ status: 200, body: Array.from(authorsMap.values()) }));
    }

    // Session IMU readings: GET /api/v1/studio/sessions/{sessionId}/readings
    if (urlWithoutQuery.endsWith('/readings') && req.method === 'GET') {
      const parts = urlWithoutQuery.split('/');
      const sessionId = parts[parts.length - 2];
      const session = activeSessions.find((s) => s.uuid === sessionId) ?? {
        uuid: sessionId,
        device_id: 'hk-device-0001',
        label: 'walk',
      };
      const readingsResponse = generateMockSessionReadings(
        session.uuid,
        session.device_id,
        session.label
      );
      return of(new HttpResponse({ status: 200, body: readingsResponse }));
    }

    // Validate/confirm session: PATCH /api/v1/studio/sessions/{sessionId}/confirm
    if (urlWithoutQuery.endsWith('/confirm') && req.method === 'PATCH') {
      const parts = urlWithoutQuery.split('/');
      const sessionId = parts[parts.length - 2];
      const index = activeSessions.findIndex((s) => s.uuid === sessionId);
      if (index !== -1) {
        activeSessions[index] = { ...activeSessions[index], is_validated: true };
        return of(new HttpResponse({ status: 200, body: activeSessions[index] }));
      }
      return throwError(
        () => new HttpErrorResponse({ status: 404, error: { detail: 'Session not found' }, url })
      );
    }

    // Trim session telemetry: PATCH /api/v1/studio/sessions/{sessionId}/trim
    if (urlWithoutQuery.endsWith('/trim') && req.method === 'PATCH') {
      const parts = urlWithoutQuery.split('/');
      const sessionId = parts[parts.length - 2];
      const session = activeSessions.find((s) => s.uuid === sessionId);
      return of(new HttpResponse({ status: 200, body: session }));
    }

    // Update session (label, is_validated): PATCH /api/v1/studio/sessions/{sessionId}
    if (req.method === 'PATCH') {
      const sessionId = urlWithoutQuery.split('/').pop();
      const index = activeSessions.findIndex((s) => s.uuid === sessionId);
      if (index !== -1) {
        const body = req.body as Partial<StudioSessionSummary>;
        activeSessions[index] = { ...activeSessions[index], ...body };
        return of(new HttpResponse({ status: 200, body: activeSessions[index] }));
      }
      return throwError(
        () => new HttpErrorResponse({ status: 404, error: { detail: 'Session not found' }, url })
      );
    }

    // Delete session: DELETE /api/v1/studio/sessions/{sessionId}
    if (req.method === 'DELETE') {
      const sessionId = urlWithoutQuery.split('/').pop();
      activeSessions = activeSessions.filter((s) => s.uuid !== sessionId);
      return of(new HttpResponse({ status: 204, body: null }));
    }

    // Single session detail: GET /api/v1/studio/sessions/{sessionId}
    const lastSegment = urlWithoutQuery.split('/').pop();
    if (req.method === 'GET' && lastSegment && lastSegment !== 'sessions') {
      const session = activeSessions.find((s) => s.uuid === lastSegment);
      if (session) {
        return of(new HttpResponse({ status: 200, body: session }));
      }
      return throwError(
        () => new HttpErrorResponse({ status: 404, error: { detail: 'Session not found' }, url })
      );
    }

    // Filtered & Paginated sessions list: GET /api/v1/studio/sessions
    if (req.method === 'GET') {
      let filtered = [...activeSessions];

      const labelParam = req.params.get('label');
      if (labelParam) {
        const labels = labelParam.split(',').map((l) => l.trim().toLowerCase());
        filtered = filtered.filter((s) => labels.includes(s.label.toLowerCase()));
      }

      const deviceIdParam = req.params.get('device_id');
      if (deviceIdParam) {
        const deviceIds = deviceIdParam.split(',').map((d) => d.trim().toLowerCase());
        filtered = filtered.filter((s) => deviceIds.includes(s.device_id.toLowerCase()));
      }

      const pseudonymParam = req.params.get('pseudonym');
      if (pseudonymParam) {
        const q = pseudonymParam.trim().toLowerCase();
        filtered = filtered.filter(
          (s) =>
            (s.author_pseudonym && s.author_pseudonym.toLowerCase().includes(q)) ||
            (s.user_email && s.user_email.toLowerCase().includes(q))
        );
      }

      const validatedParam = req.params.get('is_validated');
      if (validatedParam === 'true') {
        filtered = filtered.filter((s) => s.is_validated === true);
      } else if (validatedParam === 'false') {
        filtered = filtered.filter((s) => s.is_validated === false);
      }

      const hitlParam = req.params.get('is_hitl');
      if (hitlParam === 'true') {
        filtered = filtered.filter((s) => s.is_hitl === true);
      } else if (hitlParam === 'false') {
        filtered = filtered.filter((s) => s.is_hitl === false);
      }

      const classificationParam = req.params.get('classification');
      if (classificationParam === 'edge_ai') {
        filtered = filtered.filter((s) => isEdgeAiActivity(s.label));
      } else if (classificationParam === 'research') {
        filtered = filtered.filter((s) => !isEdgeAiActivity(s.label));
      }

      const sampleCountMin = req.params.get('sample_count_min');
      if (sampleCountMin !== null && sampleCountMin !== '') {
        const min = Number(sampleCountMin);
        filtered = filtered.filter((s) => s.sample_count >= min);
      }

      const sampleCountMax = req.params.get('sample_count_max');
      if (sampleCountMax !== null && sampleCountMax !== '') {
        const max = Number(sampleCountMax);
        filtered = filtered.filter((s) => s.sample_count <= max);
      }

      const durationMin = req.params.get('duration_sec_min');
      if (durationMin !== null && durationMin !== '') {
        const min = Number(durationMin);
        filtered = filtered.filter((s) => s.duration_sec >= min);
      }

      const durationMax = req.params.get('duration_sec_max');
      if (durationMax !== null && durationMax !== '') {
        const max = Number(durationMax);
        filtered = filtered.filter((s) => s.duration_sec <= max);
      }

      const startDate = req.params.get('start_date');
      if (startDate) {
        filtered = filtered.filter((s) => s.created_at >= startDate);
      }

      const endDate = req.params.get('end_date');
      if (endDate) {
        filtered = filtered.filter((s) => s.created_at <= endDate);
      }

      const page = Math.max(1, Number(req.params.get('page')) || 1);
      const size = Math.max(1, Number(req.params.get('size')) || 20);
      const startIndex = (page - 1) * size;
      const paginatedItems = filtered.slice(startIndex, startIndex + size);

      const response: PaginatedSessionsResponse = {
        items: paginatedItems,
        total: filtered.length,
        page,
        size,
        next_cursor: null,
        prev_cursor: null,
      };

      return of(new HttpResponse({ status: 200, body: response }));
    }
  }

  // 2. Devices list: GET /api/v1/devices
  if (url.includes('/api/v1/devices') && req.method === 'GET') {
    return of(new HttpResponse({ status: 200, body: INITIAL_DEV_DEVICES }));
  }

  // 3. Studio Dataset Stats: GET /api/v1/studio/stats or GET /api/v1/devices/{id}/studio/stats
  if (url.includes('/studio/stats') && req.method === 'GET') {
    return of(new HttpResponse({ status: 200, body: DEV_STUDIO_DATASET_STATS }));
  }

  return next(req);
};
