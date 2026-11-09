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
  if (!isStandardStudioLabel(label)) {
    return CUSTOM_LABEL_BADGE_CLASS;
  }
  if (label === 'idle') {
    return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200';
  }
  if (label.startsWith('fall_')) {
    return 'bg-red-100 text-red-800 border-red-200';
  }
  if (label === 'walk' || label === 'run') {
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  }
  if (label === 'stairs' || label === 'stumble_recover') {
    return 'bg-amber-100 text-amber-800 border-amber-200';
  }
  return 'bg-indigo-100 text-indigo-800 border-indigo-200';
}

/**
 * Returns the localized display name for a Studio activity label.
 */
export function getStudioLabelDisplayName(
  label: string,
  translation?: Pick<TranslationService, 'translate'>,
): string {
  if (!label) return '';
  if (isStandardStudioLabel(label) && translation) {
    const key = `studio.labels.${label}`;
    const translated = translation.translate(key);
    return translated !== key ? translated : label;
  }
  return label;
}

/**
 * Returns the emoji/icon for a Studio activity label.
 */
export function getStudioLabelIcon(
  labelId: string,
  predefinedLabels: PredefinedLabel[] = PREDEFINED_LABELS,
): string {
  const found = predefinedLabels.find((l) => l.id === labelId);
  return found ? found.icon : CUSTOM_LABEL_ICON;
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
