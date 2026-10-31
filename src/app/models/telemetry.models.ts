import { components } from './generated-api.types';

/**
 * Telemetry and IMU models for HealthKicks Studio capture and visual inspection.
 */

export type ImuReading = components['schemas']['ImuReadingResponse'];
export type ImuReadingResponse = components['schemas']['ImuReadingResponse'];

export type StudioSessionReadingsResponse = components['schemas']['StudioSessionReadingsResponse'];

export type StudioStartRequest = components['schemas']['StudioStartRequest'];
export type StudioStartResponse = components['schemas']['StudioStartResponse'];

export type StudioDatasetStatsResponse = components['schemas']['StudioDatasetStatsResponse'] & {
  by_label_validated?: { [key: string]: number };
  by_label_pending?: { [key: string]: number };
  edge_ai_labels?: string[];
};
export type StudioDatasetStats = StudioDatasetStatsResponse;

export interface StudioClassDurationStats {
  median_sec: number;
  mean_sec: number;
  std_sec: number;
  min_sec: number;
  max_sec: number;
}

export interface StudioClassMlMetrics {
  precision: number;
  recall: number;
  f1_score: number;
  support_windows: number;
}

export interface StudioClassDailyCount {
  date: string;
  count: number;
  validated_count: number;
  pending_count: number;
}

export interface StudioClassDetailStatsResponse {
  label: string;
  total_sessions: number;
  validated_sessions: number;
  pending_sessions: number;
  duration_metrics: StudioClassDurationStats;
  ml_metrics: StudioClassMlMetrics;
  daily_counts: StudioClassDailyCount[];
}
