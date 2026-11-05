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
  first_session_date?: string | null;
  latest_session_date?: string | null;
  duration_metrics: StudioClassDurationStats;
  ml_metrics: StudioClassMlMetrics;
  daily_counts: StudioClassDailyCount[];
}

export interface StudioClassSummaryItem {
  label: string;
  total_sessions: number;
  validated_sessions: number;
  pending_sessions: number;
  total_duration_sec: number;
  median_duration_sec: number;
  first_session_date: string | null;
  latest_session_date: string | null;
  precision: number;
  recall: number;
  f1_score: number;
  support_windows: number;
}

export interface StudioConfusionMatrix {
  labels: string[];
  matrix: number[][];
}

export interface StudioClassesSummaryResponse {
  total_classes: number;
  total_sessions: number;
  validated_sessions: number;
  pending_sessions: number;
  total_duration_sec: number;
  macro_precision: number;
  macro_recall: number;
  macro_f1: number;
  daily_counts: StudioClassDailyCount[];
  classes: StudioClassSummaryItem[];
  confusion_matrix?: StudioConfusionMatrix | null;
}

