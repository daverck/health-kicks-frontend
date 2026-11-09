import { describe, it, expect, vi } from 'vitest';
import {
  formatClassLabel,
  createDistributionChartConfig,
  createTimelineChartConfig,
} from './studio-classes-chart.factory';
import {
  StudioClassSummaryItem,
  StudioClassDailyCount,
} from '../../models/telemetry.models';

describe('StudioClassesChartFactory', () => {
  const mockClasses: StudioClassSummaryItem[] = [
    {
      label: 'walk_stairs',
      total_sessions: 20,
      validated_sessions: 16,
      pending_sessions: 4,
      total_duration_sec: 100.0,
      median_duration_sec: 5.0,
      first_session_date: '2026-10-01',
      latest_session_date: '2026-10-31',
      precision: 0.90, // Amber / Green
      recall: 0.88,
      f1_score: 0.89,
      support_windows: 400,
    },
    {
      label: 'idle',
      total_sessions: 5,
      validated_sessions: 5,
      pending_sessions: 0,
      total_duration_sec: 25.0,
      median_duration_sec: 5.0,
      first_session_date: '2026-10-05',
      latest_session_date: '2026-10-20',
      precision: 0.65, // Red (< 70%)
      recall: 0.60,
      f1_score: 0.62,
      support_windows: 100,
    },
  ];

  const mockDailyCounts: StudioClassDailyCount[] = [
    { date: '2026-10-01', count: 5, validated_count: 4, pending_count: 1 },
    { date: '2026-10-02', count: 10, validated_count: 8, pending_count: 2 },
  ];

  describe('formatClassLabel', () => {
    it('should format snake_case to uppercase words', () => {
      expect(formatClassLabel('walk_stairs')).toBe('WALK STAIRS');
      expect(formatClassLabel('idle')).toBe('IDLE');
    });
  });

  describe('createDistributionChartConfig', () => {
    it('should build stacked bar chart in distribution mode with validated and pending datasets', () => {
      const onSelectClass = vi.fn();
      const config = createDistributionChartConfig({
        classes: mockClasses,
        selectedClass: null,
        metric: 'distribution',
        onSelectClass,
      });

      expect(config.type).toBe('bar');
      expect(config.data.labels).toEqual(['WALK STAIRS', 'IDLE']);
      expect(config.data.datasets.length).toBe(2);

      const [validated, pending] = config.data.datasets;
      expect(validated.label).toBe('Validated Sessions');
      expect(validated.data).toEqual([16, 5]);
      expect(pending.label).toBe('Pending Sessions');
      expect(pending.data).toEqual([4, 0]);

      // Verify click callback delegates to onSelectClass
      const clickFn = config.options?.onClick as any;
      expect(typeof clickFn).toBe('function');
      clickFn({}, [{ index: 0 }]);
      expect(onSelectClass).toHaveBeenCalledWith('walk_stairs');
    });

    it('should highlight selected class with prominent color in distribution mode', () => {
      const config = createDistributionChartConfig({
        classes: mockClasses,
        selectedClass: 'idle',
        metric: 'distribution',
      });

      const validatedColors = config.data.datasets[0].backgroundColor as string[];
      // First is walk_stairs (not selected -> faded #A7F3D0), second is idle (selected -> #10B981)
      expect(validatedColors[0]).toBe('#A7F3D0');
      expect(validatedColors[1]).toBe('#10B981');
    });

    it('should build performance metric chart in f1 mode with threshold color coding', () => {
      const config = createDistributionChartConfig({
        classes: mockClasses,
        selectedClass: null,
        metric: 'f1',
      });

      expect(config.type).toBe('bar');
      expect(config.data.datasets.length).toBe(1);
      const dataset = config.data.datasets[0];
      expect(dataset.label).toBe('F1-Score');
      // Sorted by f1 descending: walk_stairs (89%), idle (62%)
      expect(dataset.data).toEqual([89.0, 62.0]);

      const colors = dataset.backgroundColor as string[];
      // 89% (>= 85%) -> Green (#10B981), 62% (< 70%) -> Red (#EF4444)
      expect(colors[0]).toBe('#10B981');
      expect(colors[1]).toBe('#EF4444');
    });
  });

  describe('createTimelineChartConfig', () => {
    it('should build timeline chart configuration from daily counts', () => {
      const config = createTimelineChartConfig(mockDailyCounts);

      expect(config.type).toBe('bar');
      expect(config.data.labels).toEqual(['2026-10-01', '2026-10-02']);
      expect(config.data.datasets.length).toBe(2);

      const [validated, pending] = config.data.datasets;
      expect(validated.label).toBe('Validated');
      expect(validated.data).toEqual([4, 8]);
      expect(pending.label).toBe('Pending');
      expect(pending.data).toEqual([1, 2]);

      expect((config.options?.scales as any)?.x?.stacked).toBe(true);
      expect((config.options?.scales as any)?.y?.stacked).toBe(true);
    });
  });
});
