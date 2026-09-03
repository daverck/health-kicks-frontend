/**
 * Utilitaires de conversion pour l'échelle d'intensité haptique.
 * Échelle utilisateur : 10 niveaux (1 à 10).
 * Échelle API backend : 128 à 255.
 */

export const HAPTIC_MIN_INTENSITY = 128;
export const HAPTIC_MAX_INTENSITY = 255;
export const HAPTIC_MIN_LEVEL = 1;
export const HAPTIC_MAX_LEVEL = 10;

/**
 * Convertit un niveau utilisateur (1 à 10) en valeur d'intensité pour le backend (128 à 255).
 */
export function levelToIntensity(level: number): number {
  const clamped = Math.max(HAPTIC_MIN_LEVEL, Math.min(HAPTIC_MAX_LEVEL, Math.round(level)));
  return Math.round(
    HAPTIC_MIN_INTENSITY + ((clamped - HAPTIC_MIN_LEVEL) * (HAPTIC_MAX_INTENSITY - HAPTIC_MIN_INTENSITY)) / (HAPTIC_MAX_LEVEL - HAPTIC_MIN_LEVEL)
  );
}

/**
 * Convertit une intensité backend (128 à 255) en niveau utilisateur (1 à 10).
 * Les valeurs inférieures à 128 sont calées au niveau 1.
 */
export function intensityToLevel(intensity: number): number {
  if (intensity <= HAPTIC_MIN_INTENSITY) return HAPTIC_MIN_LEVEL;
  if (intensity >= HAPTIC_MAX_INTENSITY) return HAPTIC_MAX_LEVEL;
  return Math.max(
    HAPTIC_MIN_LEVEL,
    Math.min(
      HAPTIC_MAX_LEVEL,
      Math.round(HAPTIC_MIN_LEVEL + ((intensity - HAPTIC_MIN_INTENSITY) * (HAPTIC_MAX_LEVEL - HAPTIC_MIN_LEVEL)) / (HAPTIC_MAX_INTENSITY - HAPTIC_MIN_INTENSITY))
    )
  );
}
