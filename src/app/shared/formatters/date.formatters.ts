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
