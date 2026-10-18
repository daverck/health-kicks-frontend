import { components } from './generated-api.types';

// ---------- Auth ----------

export type UserResponse = components['schemas']['UserResponse'];
export type UserRole = components['schemas']['UserRole'];
export type UserUpdate = components['schemas']['UserUpdate'];

/** Local profile edit payload (name is not yet part of UserUpdate contract). */
export interface ProfileUpdatePayload {
  name?: string;
  email?: string;
}

export type User = UserResponse;
export type TokenResponse = components['schemas']['TokenResponse'];
export type OAuthLoginResponse = components['schemas']['OAuthLoginResponse'];
export type OAuthCallbackRequest = components['schemas']['OAuthCallbackRequest'];
export type OAuthTicketExchangeRequest = components['schemas']['OAuthTicketExchangeRequest'];

export interface AuthTokens {
  access_token: string;
  token_type?: string;
}

// ---------- Devices / IoT ----------

export type DeviceCreate = components['schemas']['DeviceCreate'];
export type DeviceResponse = components['schemas']['DeviceResponse'];
export type DeviceStatus = components['schemas']['DeviceStatus'];

export type HapticTrigger = components['schemas']['HapticTrigger'];

/** Loose response shape for the haptic trigger endpoint (map of string|integer). */
export interface HapticTriggerResponse {
  [key: string]: string | number;
}

export type HapticLogItem = components['schemas']['HapticLogResponse'];
export type HapticLogResponse = components['schemas']['HapticLogResponse'];
export type HapticLogPage = components['schemas']['HapticLogPage'];

// ---------- Activity events (history) ----------

export type ActivityEvent = components['schemas']['ActivityEventResponse'];
export type ActivityEventResponse = components['schemas']['ActivityEventResponse'];
export type ActivityEventPage = components['schemas']['ActivityEventPage'];

// Backward-compatibility aliases
export type FallEventResponse = ActivityEvent;
export type FallEventPage = ActivityEventPage;

// ---------- Health & Ingestion ----------

export type HealthResponse = components['schemas']['HealthResponse'];
export type IngestionResponse = components['schemas']['IngestionResponse'];

// ---------- Telemetry & Studio ----------

export * from './telemetry.models';
export * from './studio-history.model';

