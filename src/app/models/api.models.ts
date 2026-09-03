/**
 * TypeScript models generated from the backend OpenAPI contract:
 * http://healthkicks.duckdns.org:8000/openapi.json (HealthKicks Cloud API 1.0.0)
 */

// ---------- Auth ----------

export interface UserResponse {
  id: number;
  email: string;
  name?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  is_active: boolean;
}

export type UserRole = 'admin' | 'clinician' | 'user';

export interface UserUpdate {
  role?: UserRole | null;
  is_active?: boolean | null;
}

/** Local profile edit payload (name is not yet part of UserUpdate contract). */
export interface ProfileUpdatePayload {
  name?: string;
  email?: string;
}

export interface AuthTokens {
  access_token: string;
  token_type?: string;
}

// ---------- Devices / IoT ----------

export interface DeviceCreate {
  device_id: string;
  name?: string | null;
}

export interface DeviceResponse {
  id: number;
  device_id: string;
  name?: string | null;
  status: string;
  last_seen_utc?: string | null;
  created_at: string;
  bound_at_utc?: string | null;
}

export interface HapticTrigger {
  /** 0 - 255 */
  intensity: number;
  /** 50 - 10000 ms, default 500 */
  duration_ms?: number;
}

/** Loose response shape for the haptic trigger endpoint (map of string|integer). */
export interface HapticTriggerResponse {
  [key: string]: string | number;
}

// ---------- Fall events (history) ----------

export interface FallEventResponse {
  id: number;
  device_id: string;
  timestamp_utc: string;
  confidence_score?: number | null;
  raw_imu_json: Record<string, unknown>;
  status_enum: string;
}

export interface FallEventPage {
  items: FallEventResponse[];
  page: number;
  page_size: number;
  total: number;
}

// ---------- Health ----------

export interface HealthResponse {
  status: string;
  database: string;
}

export interface IngestionResponse {
  status: string;
  msg_id: string;
  duplicate: boolean;
}
