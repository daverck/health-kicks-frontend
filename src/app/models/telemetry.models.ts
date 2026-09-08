/**
 * Telemetry and IMU models for HealthKicks Studio capture and visual inspection.
 */

export interface ImuReading {
  timestamp_epoch_us: number;
  timestamp_iso: string;
  ax: number;
  ay: number;
  az: number;
  gx: number;
  gy: number;
  gz: number;
  session_id?: string | null;
  label?: string | null;
}

export interface StudioSessionReadingsResponse {
  device_id: string;
  session_id: string;
  label?: string | null;
  sample_count: number;
  readings: ImuReading[];
}

export interface StudioStartRequest {
  label: string;
  duration_sec?: number;
  pulse_count?: number;
  pulse_duration_ms?: number;
  pulse_pause_ms?: number;
  pulse_intensity?: number;
}

export interface StudioStartResponse {
  status: string;
  device_id: string;
  session_id: string;
  label: string;
  duration_sec: number;
  topic: string;
}

export interface StudioDatasetStats {
  device_id?: string;
  total_sessions: number;
  by_label: Record<string, number>;
}

