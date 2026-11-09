/**
 * Shared numeric formatting utilities.
 */

/**
 * Formats a ratio (0.0 to 1.0) into a percentage string (e.g. 0.954 -> "95.4%").
 * Returns a fallback string (default '—') if the value is null, undefined, or NaN.
 */
export function formatPercentScore(
  val: number | null | undefined,
  digits = 1,
  fallback = '—'
): string {
  if (val === null || val === undefined || isNaN(val)) {
    return fallback;
  }
  return `${(val * 100).toFixed(digits)}%`;
}
