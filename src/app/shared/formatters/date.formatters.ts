/**
 * Shared date formatting and range resolution utilities.
 */

/**
 * Formats a Date object to local 'YYYY-MM-DD' format using local calendar parts.
 */
export function formatLocalDateToYmd(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Backward compatibility alias for formatLocalDateToYmd.
 */
export const getLocalDateString = formatLocalDateToYmd;

/**
 * Formats a 'YYYY-MM-DD' string into 'DD/MM/YYYY' display format.
 */
export function formatDateDisplay(ymd: string): string {
  if (!ymd) return '';
  const parts = ymd.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return ymd;
}

/**
 * Computes the first and last day date strings ('YYYY-MM-DD') for a given year and month (1-12).
 */
export function getMonthDateBounds(year: number, month: number): { fromDate: string; toDate: string } {
  const monthStr = String(month).padStart(2, '0');
  const fromDate = `${year}-${monthStr}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const lastDayStr = String(lastDay).padStart(2, '0');
  const toDate = `${year}-${monthStr}-${lastDayStr}`;
  return { fromDate, toDate };
}

/**
 * Formats a Date object into a localized month and year display (e.g. "novembre 2026").
 */
export function formatMonthYear(date: Date, locale = 'fr-FR'): string {
  return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

/**
 * Formats a 'YYYY-MM' string into a localized month and year display (e.g. "novembre 2026").
 */
export function formatMonthYearFromYm(monthStr: string, locale = 'fr-FR'): string {
  if (!monthStr || monthStr.length < 7) return monthStr;
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  return formatMonthYear(date, locale);
}

/**
 * Formats a 'YYYY-MM-DD' date string into a long localized date display (e.g. "mardi 10 novembre 2026").
 */
export function formatLongLocalDate(ymd: string, locale = 'fr-FR'): string {
  if (!ymd) return '';
  const parts = ymd.split('-').map(Number);
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return ymd;
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  return dateObj.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
