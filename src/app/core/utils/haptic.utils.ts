/**
 * Conversion utilities for haptic intensity scale.
 * User scale: 10 levels (1 to 10).
 * Backend API scale: 128 to 255.
 */

export const HAPTIC_MIN_INTENSITY = 128;
export const HAPTIC_MAX_INTENSITY = 255;
export const HAPTIC_MIN_LEVEL = 1;
export const HAPTIC_MAX_LEVEL = 10;

/**
 * Converts a user level (1 to 10) into an intensity value for the backend (128 to 255).
 */
export function levelToIntensity(level: number): number {
  const clamped = Math.max(HAPTIC_MIN_LEVEL, Math.min(HAPTIC_MAX_LEVEL, Math.round(level)));
  return Math.round(
    HAPTIC_MIN_INTENSITY + ((clamped - HAPTIC_MIN_LEVEL) * (HAPTIC_MAX_INTENSITY - HAPTIC_MIN_INTENSITY)) / (HAPTIC_MAX_LEVEL - HAPTIC_MIN_LEVEL)
  );
}

/**
 * Converts a backend intensity (128 to 255) into a user level (1 to 10).
 * Values below 128 are clamped to level 1.
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
