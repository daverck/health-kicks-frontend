import { components } from './generated-api.types';

/**
 * Daily step count summary by date and activity type.
 */
export type DailyStepsSummary = components['schemas']['DailyStepsSummary'];

/**
 * Historical daily step count response for a device.
 */
export type DailyStepsHistoryResponse = components['schemas']['DailyStepsHistoryResponse'];

/**
 * Hourly step distribution item for a 24-hour cycle.
 */
export type HourlyStepItem = components['schemas']['HourlyStepItem'];

/**
 * Hourly steps response breakdown for a specific date.
 */
export type HourlyStepsResponse = components['schemas']['HourlyStepsResponse'];

/**
 * Multi-activity step snapshot sync payload sent by IoT devices or mobile gateways.
 */
export type DailyStepsSyncPayload = components['schemas']['DailyStepsSyncPayload'];

/**
 * Synchronization confirmation response from backend step ingestion service.
 */
export type DailyStepsSyncResponse = components['schemas']['DailyStepsSyncResponse'];

