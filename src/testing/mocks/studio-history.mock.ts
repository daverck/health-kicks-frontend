import {
  StudioSessionSummary,
  PaginatedSessionsResponse,
} from '../../app/models/studio-history.model';

export const mockStudioSessionSummaries: StudioSessionSummary[] = [
  {
    id: 'sess-001',
    device_id: 'hk-device-0001',
    user_id: 1,
    user_email: 'admin@healthkicks.org',
    label: 'walk',
    sample_count: 500,
    duration_sec: 5,
    created_at: '2026-09-08T10:30:00.000Z',
  },
  {
    id: 'sess-002',
    device_id: 'hk-device-0001',
    user_id: 2,
    user_email: 'user2@healthkicks.org',
    label: 'fall_forward',
    sample_count: 500,
    duration_sec: 5,
    created_at: '2026-09-08T11:15:00.000Z',
  },
  {
    id: 'sess-003',
    device_id: 'hk-device-0002',
    user_id: 1,
    user_email: 'admin@healthkicks.org',
    label: 'stairs',
    sample_count: 480,
    duration_sec: 5,
    created_at: '2026-09-08T12:00:00.000Z',
  },
];

export const mockPaginatedSessionsResponse: PaginatedSessionsResponse = {
  items: mockStudioSessionSummaries,
  total: 3,
  page: 1,
  size: 20,
};
