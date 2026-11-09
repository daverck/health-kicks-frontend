import { TranslationService } from '../../core/services/translation.service';
import {
  FallAlertDetail,
  FallAlertSummary,
} from '../../models/api.models';
import { PREDEFINED_LABELS, isStandardStudioLabel } from '../../models/studio.model';

/**
 * Maps an event type string to its localized human-readable label.
 */
export function formatFallTypeLabel(eventType: string, translation: TranslationService): string {
  if (eventType === 'fall_generic') {
    return translation.translate('fall_alerts.fall_generic');
  }
  if (isStandardStudioLabel(eventType)) {
    const key = `studio.labels.${eventType}`;
    const translated = translation.translate(key);
    if (translated !== key) return translated;
  }
  const found = PREDEFINED_LABELS.find((l) => l.id === eventType);
  return found ? found.name : eventType;
}

/**
 * Maps an alert lifecycle state code to its localized label.
 */
export function formatFallAlertStateLabel(state: string, translation: TranslationService): string {
  const key = `fall_alerts.state_${state}`;
  const translated = translation.translate(key);
  return translated !== key ? translated : state;
}

/**
 * Returns Tailwind CSS badge classes for a given alert state.
 */
export function getFallAlertStateBadgeClass(state: string): string {
  switch (state) {
    case 'ACKNOWLEDGED':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
    case 'PENDING':
    case 'ESCALATING':
      return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
    case 'EXHAUSTED':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
    case 'CANCELLED':
    case 'SUPPRESSED':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  }
}

/**
 * Returns Tailwind CSS badge classes for emergency contact notification status.
 */
export function getNotificationStatusBadgeClass(status: string): string {
  switch (status) {
    case 'ACKNOWLEDGED':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300';
    case 'PENDING_SMS':
      return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300';
    case 'SENT':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300';
    case 'FAILED':
    default:
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300';
  }
}

/**
 * Formats the resolution text of a fall alert (who acknowledged or how it was cancelled).
 */
export function formatFallAlertResolution(
  alert: FallAlertSummary,
  translation: TranslationService,
  isClinicianOrAdmin: boolean
): string {
  if (alert.acknowledged_by) {
    if (isClinicianOrAdmin || alert.is_pseudonymized) {
      let rank = alert.acknowledged_by.rank;
      if (rank == null && (alert as FallAlertDetail).notifications) {
        const ackNotif = (alert as FallAlertDetail).notifications.find(
          (n) => n.status === 'ACKNOWLEDGED'
        );
        if (ackNotif) {
          rank = ackNotif.rank;
        }
      }
      return translation.translate('fall_alerts.ack_by_index_label', {
        index: rank ?? 1,
      });
    }
    const fullName = `${alert.acknowledged_by.first_name} ${alert.acknowledged_by.last_name}`.trim();
    return translation.translate('fall_alerts.ack_by_label', { name: fullName });
  }
  if (alert.cancel_reason === 'user_cancel') {
    return translation.translate('fall_alerts.cancel_user_cancel');
  }
  if (alert.cancel_reason === 'fall_recovery') {
    return translation.translate('fall_alerts.cancel_fall_recovery');
  }
  return '—';
}

/**
 * Extracts the subject display pseudonym for GDPR compliance.
 */
export function getSubjectPseudonym(
  alert: FallAlertSummary | FallAlertDetail | null | undefined
): string {
  if (!alert) return '—';
  return alert.user_pseudonym || alert.subject_pseudonym || alert.user_display_name || '—';
}

/**
 * Builds a Google Maps search URL from latitude and longitude.
 */
export function getGoogleMapsUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps?q=${lat},${lon}`;
}
