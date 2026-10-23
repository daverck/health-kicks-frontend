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

// ---------- Fall Alerting & Emergency Contacts ----------

export type AlertContactCreate = components['schemas']['AlertContactCreate'];
export type AlertContactUpdate = components['schemas']['AlertContactUpdate'];
export type AlertContactsOrderPayload = components['schemas']['AlertContactsOrderPayload'];
export type AlertContactResponse = components['schemas']['AlertContactResponse'];
export type AlertContactTestEmailResponse = components['schemas']['AlertContactTestEmailResponse'];

export type FallAlertState =
  | 'PENDING'
  | 'ESCALATING'
  | 'ACKNOWLEDGED'
  | 'CANCELLED'
  | 'EXHAUSTED'
  | 'SUPPRESSED';

export type FallAlertAction = components['schemas']['FallAlertAction'];
export type FallAlertCancelReason = components['schemas']['FallAlertCancelReason'];
export type FallAlertDelivery = components['schemas']['FallAlertDelivery'];
export type FallAlertNotificationStatus = 'SENT' | 'ACKNOWLEDGED' | 'FAILED';

export type FallAlertAcknowledgedBy = components['schemas']['FallAlertAcknowledgedBy'];
export type FallAlertLocationResponse = components['schemas']['FallAlertLocationResponse'];
export type FallAlertNotificationResponse = components['schemas']['FallAlertNotificationResponse'];
export type FallAlertSummary = components['schemas']['FallAlertSummary'];
export type FallAlertDetail = components['schemas']['FallAlertDetail'];
export type PaginatedFallAlertsResponse = components['schemas']['PaginatedFallAlertsResponse'];

// ---------- Health & Ingestion ----------

export type HealthResponse = components['schemas']['HealthResponse'];
export type IngestionResponse = components['schemas']['IngestionResponse'];

// ---------- Telemetry & Studio ----------

export * from './telemetry.models';
export * from './studio-history.model';

// ---------- Standard Error Payloads ----------

/** Individual validation error item returned by FastAPI HTTP 422 responses. */
export interface ApiValidationErrorItem {
  loc: (string | number)[];
  msg: string;
  type: string;
}

/** Standard FastAPI error payload containing either a message or validation array. */
export interface ApiErrorPayload {
  detail: string | ApiValidationErrorItem[];
}
