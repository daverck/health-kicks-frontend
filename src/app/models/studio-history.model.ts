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
}

export interface PaginatedSessionsResponse {
  items: StudioSessionSummary[];
  total: number;
  page: number;
  size: number;
}

export interface StudioSessionUpdatePayload {
  label: string;
}

export interface StudioHistoryFilterParams {
  page?: number;
  size?: number;
  label?: string;
  device_id?: string;
  user_id?: number;
  start_date?: string;
  end_date?: string;
}
