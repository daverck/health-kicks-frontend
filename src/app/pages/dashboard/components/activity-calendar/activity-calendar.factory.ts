export interface CalendarDayItem {
  dayNumber: number;
  dateStr: string;
  totalSteps: number;
  level: number;
  isSelected: boolean;
}

export interface YearMonth {
  year: number;
  month: number;
}

/**
 * Resolves activity intensity level (0 to 3) based on step count thresholds:
 * - Level 3: >= 10,000 steps
 * - Level 2: >= 6,000 steps
 * - Level 1: >= 2,000 steps
 * - Level 0: < 2,000 steps
 */
export function resolveStepActivityLevel(totalSteps: number): number {
  if (totalSteps >= 10000) return 3;
  if (totalSteps >= 6000) return 2;
  if (totalSteps >= 2000) return 1;
  return 0;
}

/**
 * Resolves previous year and month navigating backward by 1 month.
 */
export function resolvePreviousMonth(year: number, month: number): YearMonth {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
}

/**
 * Resolves next year and month navigating forward by 1 month.
 */
export function resolveNextMonth(year: number, month: number): YearMonth {
  if (month === 12) {
    return { year: year + 1, month: 1 };
  }
  return { year, month: month + 1 };
}

/**
 * Builds the array of calendar days with step summaries and intensity levels.
 */
export function buildCalendarDays(
  year: number,
  month: number,
  summaries: Record<string, number>,
  selectedDate?: string
): CalendarDayItem[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const days: CalendarDayItem[] = [];
  const monthStr = month < 10 ? `0${month}` : `${month}`;

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = d < 10 ? `0${d}` : `${d}`;
    const dateStr = `${year}-${monthStr}-${dayStr}`;
    const totalSteps = summaries[dateStr] ?? 0;

    days.push({
      dayNumber: d,
      dateStr,
      totalSteps,
      level: resolveStepActivityLevel(totalSteps),
      isSelected: selectedDate === dateStr,
    });
  }

  return days;
}

/**
 * Returns the Tailwind CSS classes for a calendar day item.
 */
export function getCalendarDayClass(day: { level: number; isSelected: boolean }): string {
  let base = 'transition-all cursor-pointer rounded-lg p-1.5 text-center flex flex-col items-center justify-center ';

  if (day.isSelected) {
    base += 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900 ';
  }

  switch (day.level) {
    case 3:
      return base + 'bg-emerald-600 text-white font-bold shadow-sm hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500';
    case 2:
      return base + 'bg-emerald-300 text-emerald-950 font-semibold hover:bg-emerald-400 dark:bg-emerald-700/80 dark:text-emerald-100 dark:hover:bg-emerald-600';
    case 1:
      return base + 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:hover:bg-emerald-900/80';
    default:
      return base + 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800/80 dark:text-gray-300 dark:hover:bg-gray-700';
  }
}
