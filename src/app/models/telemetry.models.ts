import { components } from './generated-api.types';

/**
 * Telemetry and IMU models for HealthKicks Studio capture and visual inspection.
 */

export type ImuReading = components['schemas']['ImuReadingResponse'];
export type ImuReadingResponse = components['schemas']['ImuReadingResponse'];

export type StudioSessionReadingsResponse = components['schemas']['StudioSessionReadingsResponse'];

export type StudioStartRequest = components['schemas']['StudioStartRequest'];
export type StudioStartResponse = components['schemas']['StudioStartResponse'];

export type StudioDatasetStatsResponse = components['schemas']['StudioDatasetStatsResponse'];
export type StudioDatasetStatsResponse = components['schemas']['StudioDatasetStatsResponse'] & {
  by_label_validated?: { [key: string]: number };
  by_label_pending?: { [key: string]: number };
};
export type StudioDatasetStats = StudioDatasetStatsResponse;


