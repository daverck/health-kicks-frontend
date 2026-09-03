import {
  DeviceCreate,
  DeviceResponse,
  FallEventPage,
  FallEventResponse,
  HapticTriggerResponse,
  HealthResponse,
} from '../../app/models/api.models';

export const mockDeviceCreate: DeviceCreate = {
  device_id: 'HK-SHOE-001',
  name: 'Semelle Pied Droit',
};

export const mockBoundDevice: DeviceResponse = {
  id: 3,
  device_id: 'HK-SHOE-001',
  name: 'Semelle Pied Droit',
  status: 'offline',
  last_seen_utc: null,
  created_at: '2026-09-03T09:00:00Z',
  bound_at_utc: '2026-09-03T10:15:30Z',
};

export const mockDevices: DeviceResponse[] = [
  {
    id: 1,
    device_id: 'hk-device-0001',
    name: 'Bracelet Démo — Marie D.',
    status: 'online',
    last_seen_utc: '2026-09-01T12:00:00Z',
    created_at: '2025-11-02T09:00:00Z',
    bound_at_utc: '2025-11-02T09:30:00Z',
  },
  {
    id: 2,
    device_id: 'hk-device-0002',
    name: 'Bracelet Test — Salle 4',
    status: 'offline',
    last_seen_utc: '2026-08-30T14:12:00Z',
    created_at: '2025-12-15T11:30:00Z',
    bound_at_utc: '2025-12-15T11:45:00Z',
  },
];

export const mockFallEvents: FallEventResponse[] = [
  {
    id: 101,
    device_id: 'hk-device-0001',
    timestamp_utc: '2026-09-02T08:30:00Z',
    confidence_score: 0.95,
    raw_imu_json: { ax: 0.12, ay: 0.98, az: -0.05 },
    status_enum: 'fall_detected',
  },
  {
    id: 102,
    device_id: 'hk-device-0001',
    timestamp_utc: '2026-09-02T10:15:00Z',
    confidence_score: 0.88,
    raw_imu_json: { ax: 0.05, ay: 0.44, az: -0.89 },
    status_enum: 'vibration_sent',
  },
];

export const mockFallEventPage: FallEventPage = {
  items: mockFallEvents,
  page: 1,
  page_size: 20,
  total: 2,
};

export const mockHapticResponse: HapticTriggerResponse = {
  status: 'delivered',
  device_id: 'hk-device-0001',
  intensity: 180,
  duration_ms: 500,
};

export const mockHealthResponse: HealthResponse = {
  status: 'healthy',
  database: 'connected',
};

