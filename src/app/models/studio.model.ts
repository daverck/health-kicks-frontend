/**
 * Studio capture models and activity label definitions.
 */

export type StudioActivityCode =
  | 'idle'
  | 'walk'
  | 'run'
  | 'stairs'
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
    id: 'idle',
    name: 'Immobile / Repos',
    icon: '⏸️',
    description: 'Capteur posé sur une table ou personne debout/assise sans bouger',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200',
  },
  {
    id: 'walk',
    name: 'Marche',
    icon: '🚶',
    description: 'Pas réguliers sur sol plat',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
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
    description: 'Montée ou descente de marches',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
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

