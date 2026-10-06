/**
 * Daily step count summary by date and activity type.
 */
export interface DailyStepsSummary {
  date: string; // YYYY-MM-DD
  total_steps: number;
  by_activity: Record<string, number>; // e.g. { walk: 4120, run: 1850, stairs: 310 }
}

/**
 * Historical daily step count response for a device.
 */
export interface DailyStepsHistoryResponse {
  device_id: string;
  from_date: string;
  to_date: string;
  history: DailyStepsSummary[];
}

export interface HourlyStepItem {
  hour: number;
  total_steps: number;
  by_activity: Record<string, number>;
}

export interface HourlyStepsResponse {
  device_id: string;
  date: string;
  hourly_data: HourlyStepItem[];
}
