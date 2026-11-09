import { TranslationService } from '../../core/services/translation.service';
import { StudioSessionSummary } from '../../models/studio-history.model';
import {
  CUSTOM_LABEL_BADGE_CLASS,
  CUSTOM_LABEL_ICON,
  PREDEFINED_LABELS,
  PredefinedLabel,
  isStandardStudioLabel,
} from '../../models/studio.model';

/**
 * Returns Tailwind CSS badge classes for a given Studio activity label.
 */
export function getStudioLabelBadgeClass(label: string): string {
  if (!label) return CUSTOM_LABEL_BADGE_CLASS;
  const lower = label.toLowerCase();
  if (lower.includes('fall') && lower !== 'fall_recovery') {
    return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300';
  }
  if (!isStandardStudioLabel(label)) {
    return CUSTOM_LABEL_BADGE_CLASS;
  }
  switch (label) {
    case 'idle':
      return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200';
    case 'walk':
    case 'run':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300';
    case 'stairs':
    case 'stumble_recover':
      return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300';
    default:
      return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300';
  }
}

/**
 * Returns the localized display name for a Studio activity label.
 */
export function getStudioLabelDisplayName(
  label: string,
  translation?: Pick<TranslationService, 'translate'>,
  predefinedLabels: PredefinedLabel[] = PREDEFINED_LABELS,
): string {
  if (!label) return '';
  if (isStandardStudioLabel(label) && translation) {
    const key = `studio.labels.${label}`;
    const translated = translation.translate(key);
    if (translated !== key) return translated;
  }
  const found = predefinedLabels.find((l) => l.id === label);
  return found ? found.name : label;
}

/**
 * Returns the emoji/icon for a Studio activity label.
 */
export function getStudioLabelIcon(
  labelId: string,
  predefinedLabels: PredefinedLabel[] = PREDEFINED_LABELS,
): string {
  const found = predefinedLabels.find((l) => l.id === labelId);
  if (found) return found.icon;
  if (labelId && labelId.toLowerCase().includes('fall')) return '🚨';
  return CUSTOM_LABEL_ICON;
}

/**
 * Resolves the author name, patient pseudonym, or email for a Studio session summary.
 */
export function getStudioUserPseudonymOrEmail(session: StudioSessionSummary): string {
  return (
    session.user_email ||
    session.author_name ||
    (session.subject_pseudonym ? `Patient ${session.subject_pseudonym}` : '—')
  );
}

/**
 * Resolves the author display name for a Studio session summary, respecting pseudonymization.
 */
export function getStudioAuthorDisplayName(session: StudioSessionSummary): string {
  if (session.is_pseudonymized) {
    return (
      session.author_name ||
      (session.subject_pseudonym ? `Patient ${session.subject_pseudonym}` : '—')
    );
  }
  return getStudioUserPseudonymOrEmail(session);
}
