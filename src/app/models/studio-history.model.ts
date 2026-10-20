import type { components } from './generated-api.types';

export type StudioSessionSummary = components['schemas']['StudioSessionSummary'];
export type PaginatedSessionsResponse = components['schemas']['PaginatedSessionsResponse'];
export type StudioAuthorSummary = components['schemas']['StudioAuthorSummary'];
export type StudioSessionUpdatePayload = components['schemas']['StudioSessionUpdatePayload'];
export type StudioSessionTrimPayload = components['schemas']['StudioSessionTrimPayload'];

export interface StudioHistoryFilterParams {
  page?: number;
  size?: number;
  label?: string | string[];
  device_id?: string | string[];
  user_id?: number | string | (number | string)[];
  start_date?: string;
  end_date?: string;
  is_validated?: boolean;
  cursor?: string | null;
}
