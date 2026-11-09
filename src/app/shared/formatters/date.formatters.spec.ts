import {
  formatLocalDateToYmd,
  formatDateDisplay,
  getMonthDateBounds,
  getLocalDateString,
  formatMonthYear,
  formatMonthYearFromYm,
  formatLongLocalDate,
} from './date.formatters';

describe('date.formatters', () => {
  describe('formatLocalDateToYmd', () => {
    it('formats a date to YYYY-MM-DD correctly with zero-padding', () => {
      const d = new Date(2026, 4, 3); // May 3, 2026
      expect(formatLocalDateToYmd(d)).toBe('2026-05-03');
    });

    it('defaults to current date when no argument is passed', () => {
      const today = new Date();
      const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      expect(formatLocalDateToYmd()).toBe(expected);
    });

    it('provides getLocalDateString alias', () => {
      expect(getLocalDateString).toBe(formatLocalDateToYmd);
    });
  });

  describe('formatDateDisplay', () => {
    it('converts YYYY-MM-DD to DD/MM/YYYY', () => {
      expect(formatDateDisplay('2026-11-09')).toBe('09/11/2026');
      expect(formatDateDisplay('2026-01-05')).toBe('05/01/2026');
    });

    it('returns empty string for empty input', () => {
      expect(formatDateDisplay('')).toBe('');
    });

    it('returns original string if not in 3-part hyphenated format', () => {
      expect(formatDateDisplay('invalid-date')).toBe('invalid-date');
      expect(formatDateDisplay('2026/11/09')).toBe('2026/11/09');
    });
  });

  describe('getMonthDateBounds', () => {
    it('computes fromDate and toDate for a 31-day month', () => {
      const bounds = getMonthDateBounds(2026, 1); // January
      expect(bounds.fromDate).toBe('2026-01-01');
      expect(bounds.toDate).toBe('2026-01-31');
    });

    it('computes fromDate and toDate for February in a non-leap year', () => {
      const bounds = getMonthDateBounds(2026, 2); // February 2026
      expect(bounds.fromDate).toBe('2026-02-01');
      expect(bounds.toDate).toBe('2026-02-28');
    });

    it('computes fromDate and toDate for February in a leap year', () => {
      const bounds = getMonthDateBounds(2028, 2); // February 2028
      expect(bounds.fromDate).toBe('2028-02-01');
      expect(bounds.toDate).toBe('2028-02-29');
    });

    it('computes fromDate and toDate for a 30-day month', () => {
      const bounds = getMonthDateBounds(2026, 4); // April
      expect(bounds.fromDate).toBe('2026-04-01');
      expect(bounds.toDate).toBe('2026-04-30');
    });
  });

  describe('formatMonthYear', () => {
    it('formats date to localized month and year', () => {
      const d = new Date(2026, 10, 1); // November 2026
      const res = formatMonthYear(d, 'fr-FR');
      expect(res.toLowerCase()).toContain('novembre');
      expect(res).toContain('2026');
    });

    it('supports alternative locales', () => {
      const d = new Date(2026, 0, 1); // January 2026
      const res = formatMonthYear(d, 'en-US');
      expect(res).toBe('January 2026');
    });
  });

  describe('formatMonthYearFromYm', () => {
    it('formats YYYY-MM string to localized month and year', () => {
      const res = formatMonthYearFromYm('2026-11', 'fr-FR');
      expect(res.toLowerCase()).toContain('novembre');
      expect(res).toContain('2026');
    });

    it('returns raw string when invalid or short', () => {
      expect(formatMonthYearFromYm('')).toBe('');
      expect(formatMonthYearFromYm('2026')).toBe('2026');
    });
  });

  describe('formatLongLocalDate', () => {
    it('formats a valid YYYY-MM-DD string to full long localized format', () => {
      const res = formatLongLocalDate('2026-11-10', 'fr-FR');
      expect(res.toLowerCase()).toContain('novembre');
      expect(res).toContain('2026');
      expect(res).toContain('10');
    });

    it('returns empty string when input is empty', () => {
      expect(formatLongLocalDate('')).toBe('');
    });

    it('returns raw string when format is invalid', () => {
      expect(formatLongLocalDate('invalid-date')).toBe('invalid-date');
      expect(formatLongLocalDate('2026-11')).toBe('2026-11');
    });
  });
});
