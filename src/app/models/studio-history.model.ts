/**
 * Studio History models corresponding to FastAPI backend Pydantic schemas.
 */

export interface StudioSessionSummary {
  id: string;
  device_id: string;
  user_id: number;
  user_email?: string | null;
  label: string;
  sample_count: number;
  duration_sec: number;
  created_at: string;
  is_validated: boolean;
}

export interface PaginatedSessionsResponse {
  items: StudioSessionSummary[];
  total: number;
  page: number;
  size: number;
}

export interface StudioAuthorSummary {
  id: number;
  email: string;
  name?: string | null;
}

export interface StudioSessionUpdatePayload {
  label: string;
}

export interface StudioHistoryFilterParams {
  page?: number;
  size?: number;
  label?: string | string[];
  device_id?: string | string[];
  user_id?: number | string | (number | string)[];
  start_date?: string;
  end_date?: string;
  is_validated?: boolean;
}

