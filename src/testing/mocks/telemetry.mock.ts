import {
  ImuReading,
  StudioSessionReadingsResponse,
  StudioStartRequest,
  StudioStartResponse,
  StudioDatasetStats,
} from '../../app/models/telemetry.models';

export const mockStudioStartRequest: StudioStartRequest = {
  label: 'walk',
  duration_sec: 5,
  pulse_count: 3,
  pulse_duration_ms: 100,
  pulse_pause_ms: 200,
  pulse_intensity: 220,
};

export const mockStudioStartResponse: StudioStartResponse = {
  status: 'started',
  device_id: 'hk-device-0001',
  session_id: 'sess-abc-12345',
  label: 'walk',
  duration_sec: 5,
  topic: 'devices/hk-device-0001/commands',
};

export const mockImuReadings: ImuReading[] = [
  {
    timestamp_epoch_us: 1725700000000000,
    timestamp_iso: '2026-09-07T14:00:00.000Z',
    ax: 0.05,
    ay: 0.98,
    az: -0.12,
    gx: 0.01,
    gy: -0.02,
    gz: 0.05,
    session_id: 'sess-abc-12345',
    label: 'walk',
  },
  {
    timestamp_epoch_us: 1725700000500000,
    timestamp_iso: '2026-09-07T14:00:00.500Z',
    ax: 0.25,
    ay: 1.15,
    az: -0.08,
    gx: 0.12,
    gy: -0.05,
    gz: 0.08,
    session_id: 'sess-abc-12345',
    label: 'walk',
  },
  {
    timestamp_epoch_us: 1725700001000000,
    timestamp_iso: '2026-09-07T14:00:01.000Z',
    ax: -0.10,
    ay: 0.85,
    az: -0.15,
    gx: -0.08,
    gy: 0.03,
    gz: -0.02,
    session_id: 'sess-abc-12345',
    label: 'walk',
  },
];

export const mockStudioSessionReadingsResponse: StudioSessionReadingsResponse = {
  device_id: 'hk-device-0001',
  session_id: 'sess-abc-12345',
  label: 'walk',
  sample_count: 3,
  readings: mockImuReadings,
};

export const mockStudioDatasetStats: StudioDatasetStats = {
  device_id: 'hk-device-0001',
  total_sessions: 42,
  by_label: {
    walk: 15,
    run: 10,
    stairs: 8,
    stumble_recover: 5,
    fall_forward: 2,
    fall_backward: 1,
    fall_lateral: 1,
    fall_recovery: 0,
  },
};

