import type { components } from './generated-api.types';

export type StudioSessionSummary = Omit<components['schemas']['StudioSessionSummary'], 'user_id'> & {
  is_hitl?: boolean;
  classification?: 'all' | 'edge_ai' | 'research';
  uuid: string;
  user_id?: number | null;
};
export type StudioSessionDetail = Omit<components['schemas']['StudioSessionDetail'], 'user_id'> & {
  is_hitl?: boolean;
  classification?: 'all' | 'edge_ai' | 'research';
  uuid: string;
  user_id?: number | null;
};
export type PaginatedSessionsResponse = components['schemas']['PaginatedSessionsResponse'];
export type StudioAuthorSummary = components['schemas']['StudioAuthorSummary'];
export type StudioSessionUpdatePayload = components['schemas']['StudioSessionUpdatePayload'];
export type StudioSessionTrimPayload = components['schemas']['StudioSessionTrimPayload'];

export interface StudioHistoryFilterParams {
  page?: number;
  size?: number;
  label?: string | string[];
  device_id?: string | string[];
  pseudonym?: string | string[];
  start_date?: string;
  end_date?: string;
  sample_count_min?: number;
  sample_count_max?: number;
  duration_sec_min?: number;
  duration_sec_max?: number;
  is_validated?: boolean;
  is_hitl?: boolean;
  classification?: 'all' | 'edge_ai' | 'research';
  cursor?: string | null;
}
