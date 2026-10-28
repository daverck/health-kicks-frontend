/**
 * Studio capture models and activity label definitions.
 */

export type StudioActivityCode =
  | 'idle'
  | 'sit_down'
  | 'stand_up'
  | 'walk'
  | 'run'
  | 'stairs'
  | 'stairs_up'
  | 'stairs_down'
  | 'jump'
  | 'stumble_recover'
  | 'fall_forward'
  | 'fall_backward'
  | 'fall_lateral'
  | 'fall_recovery'
  | (string & {});

export interface PredefinedLabel {
  id: string;
  name: string;
  icon: string;
  description: string;
  badgeColor?: string;
}

export const SELECTED_DEVICE_STORAGE_KEY = 'healthkicks_selected_device_id';

export const PREDEFINED_LABELS: PredefinedLabel[] = [
  {
    id: 'walk',
    name: 'Marche',
    icon: '🚶',
    description: 'Pas réguliers sur sol plat',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    id: 'idle',
    name: 'Immobile / Repos',
    icon: '⏸️',
    description: 'Capteur posé sur une table ou personne debout/assise sans bouger',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200',
  },
  {
    id: 'sit_down',
    name: "S'asseoir (Transition)",
    icon: '🪑',
    description: 'Transition debout vers assis (chaise, fauteuil, canapé)',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/40',
  },
  {
    id: 'run',
    name: 'Course',
    icon: '🏃',
    description: 'Course modérée ou rapide',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    id: 'stairs',
    name: 'Escaliers',
    icon: '🪜',
    description: 'Montée ou descente générale de marches',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    id: 'stairs_up',
    name: 'Escaliers (Montée)',
    icon: '↗️',
    description: 'Montée continue de marches d’escalier',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    id: 'stairs_down',
    name: 'Escaliers (Descente)',
    icon: '↘️',
    description: 'Descente continue de marches d’escalier',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    id: 'jump',
    name: 'Saut',
    icon: '🦘',
    description: 'Impulsion verticale avec atterrissage dynamique',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
  },
  {
    id: 'stumble_recover',
    name: 'Trébuchement rattrapé',
    icon: '⚠️',
    description: 'Déséquilibre sans impact au sol',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    id: 'fall_forward',
    name: 'Chute avant',
    icon: '⤵️',
    description: 'Perte d’équilibre vers l’avant',
    badgeColor: 'bg-red-100 text-red-800 border-red-200',
  },
  {
    id: 'fall_backward',
    name: 'Chute arrière',
    icon: '⤴️',
    description: 'Bascule vers l’arrière',
    badgeColor: 'bg-red-100 text-red-800 border-red-200',
  },
  {
    id: 'fall_lateral',
    name: 'Chute latérale',
    icon: '↔️',
    description: 'Bascule sur le flanc gauche ou droit',
    badgeColor: 'bg-red-100 text-red-800 border-red-200',
  },
  {
    id: 'fall_recovery',
    name: 'Chute relevée',
    icon: '🔄',
    description: 'Chute au sol suivie d’un redressement',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
];

export const STANDARD_STUDIO_LABELS = PREDEFINED_LABELS;

export const STANDARD_STUDIO_LABEL_IDS = new Set<string>(
  PREDEFINED_LABELS.map((l) => l.id)
);

export function isStandardStudioLabel(labelId: string): boolean {
  return STANDARD_STUDIO_LABEL_IDS.has(labelId);
}

export function isCustomStudioLabel(labelId: string): boolean {
  return Boolean(labelId) && !STANDARD_STUDIO_LABEL_IDS.has(labelId);
}

export const CUSTOM_LABEL_ICON = '🧪';

export const CUSTOM_LABEL_BADGE_CLASS =
  'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';


export const EDGE_AI_ACTIVITY_IDS = new Set<string>([
  'idle',
  'walk',
  'run',
  'stairs',
  'stairs_up',
  'stairs_down',
  'sit_down',
  'stand_up',
  'fall_forward',
  'fall_backward',
  'fall_lateral',
  'fall_recovery',
  'stumble_recover',
  'fall_generic',
]);

export function isEdgeAiActivity(labelId: string | null | undefined): boolean {
  if (!labelId) return false;
  return EDGE_AI_ACTIVITY_IDS.has(labelId.toLowerCase().trim());
}

export type ActivityClassificationType = 'all' | 'edge_ai' | 'research';
