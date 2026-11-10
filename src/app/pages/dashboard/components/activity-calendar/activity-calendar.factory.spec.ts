import {
  buildCalendarDays,
  getCalendarDayClass,
  resolveNextMonth,
  resolvePreviousMonth,
  resolveStepActivityLevel,
} from './activity-calendar.factory';

describe('ActivityCalendarFactory', () => {
  describe('resolveStepActivityLevel', () => {
    it('should return level 3 for >= 10000 steps', () => {
      expect(resolveStepActivityLevel(10000)).toBe(3);
      expect(resolveStepActivityLevel(15420)).toBe(3);
    });

    it('should return level 2 for 6000 - 9999 steps', () => {
      expect(resolveStepActivityLevel(6000)).toBe(2);
      expect(resolveStepActivityLevel(9999)).toBe(2);
    });

    it('should return level 1 for 2000 - 5999 steps', () => {
      expect(resolveStepActivityLevel(2000)).toBe(1);
      expect(resolveStepActivityLevel(5999)).toBe(1);
    });

    it('should return level 0 for < 2000 steps', () => {
      expect(resolveStepActivityLevel(1999)).toBe(0);
      expect(resolveStepActivityLevel(0)).toBe(0);
      expect(resolveStepActivityLevel(-50)).toBe(0);
    });
  });

  describe('resolvePreviousMonth', () => {
    it('should decrement month within same year', () => {
      expect(resolvePreviousMonth(2026, 10)).toEqual({ year: 2026, month: 9 });
      expect(resolvePreviousMonth(2026, 2)).toEqual({ year: 2026, month: 1 });
    });

    it('should roll over to December of previous year when month is 1', () => {
      expect(resolvePreviousMonth(2026, 1)).toEqual({ year: 2025, month: 12 });
    });
  });

  describe('resolveNextMonth', () => {
    it('should increment month within same year', () => {
      expect(resolveNextMonth(2026, 10)).toEqual({ year: 2026, month: 11 });
      expect(resolveNextMonth(2026, 1)).toEqual({ year: 2026, month: 2 });
    });

    it('should roll over to January of next year when month is 12', () => {
      expect(resolveNextMonth(2026, 12)).toEqual({ year: 2027, month: 1 });
    });
  });

  describe('buildCalendarDays', () => {
    it('should build 31 days for October 2026 with correct formatting and levels', () => {
      const summaries = {
        '2026-10-01': 1500,
        '2026-10-02': 4500,
        '2026-10-03': 8000,
        '2026-10-04': 12500,
      };

      const days = buildCalendarDays(2026, 10, summaries, '2026-10-02');

      expect(days.length).toBe(31);
      expect(days[0]).toEqual({
        dayNumber: 1,
        dateStr: '2026-10-01',
        totalSteps: 1500,
        level: 0,
        isSelected: false,
      });
      expect(days[1]).toEqual({
        dayNumber: 2,
        dateStr: '2026-10-02',
        totalSteps: 4500,
        level: 1,
        isSelected: true,
      });
      expect(days[2].level).toBe(2);
      expect(days[3].level).toBe(3);
      expect(days[4].totalSteps).toBe(0);
      expect(days[4].level).toBe(0);
    });

    it('should handle leap years correctly in February', () => {
      const leapDays = buildCalendarDays(2024, 2, {});
      expect(leapDays.length).toBe(29);

      const nonLeapDays = buildCalendarDays(2025, 2, {});
      expect(nonLeapDays.length).toBe(28);
    });
  });

  describe('getCalendarDayClass', () => {
    it('should apply selected ring styling when isSelected is true', () => {
      const cls = getCalendarDayClass({ level: 0, isSelected: true });
      expect(cls).toContain('ring-2 ring-primary-500');
    });

    it('should apply emerald colors according to level', () => {
      expect(getCalendarDayClass({ level: 3, isSelected: false })).toContain('bg-emerald-600');
      expect(getCalendarDayClass({ level: 2, isSelected: false })).toContain('bg-emerald-300');
      expect(getCalendarDayClass({ level: 1, isSelected: false })).toContain('bg-emerald-100');
      expect(getCalendarDayClass({ level: 0, isSelected: false })).toContain('bg-gray-100');
    });
  });
});
