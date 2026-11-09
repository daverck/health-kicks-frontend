import { buildHourlyActivitySeries, buildHourlyStepsChartConfig } from './hourly-steps-chart.factory';
import { HourlyStepItem } from '../../../../models/steps.models';

describe('hourly-steps-chart.factory', () => {
  const mockHourlyData: HourlyStepItem[] = [
    {
      hour: 8,
      steps: 1200,
      by_activity: {
        walk: 800,
        run: 300,
        stairs: 100,
        unclassified: 0,
      },
    },
    {
      hour: 14,
      steps: 650,
      by_activity: {
        walk: 500,
        run: 0,
        stairs: 50,
        unclassified: 100,
      },
    },
  ];

  describe('buildHourlyActivitySeries', () => {
    it('creates 24 hour buckets with correct labels and zeros for missing hours', () => {
      const series = buildHourlyActivitySeries(mockHourlyData);

      expect(series.labels.length).toBe(24);
      expect(series.labels[0]).toBe('00:00');
      expect(series.labels[8]).toBe('08:00');
      expect(series.labels[23]).toBe('23:00');

      expect(series.walkData[8]).toBe(800);
      expect(series.runData[8]).toBe(300);
      expect(series.stairsData[8]).toBe(100);
      expect(series.otherData[8]).toBe(0);

      expect(series.walkData[14]).toBe(500);
      expect(series.runData[14]).toBe(0);
      expect(series.stairsData[14]).toBe(50);
      expect(series.otherData[14]).toBe(100);

      // Unfilled hour (e.g. hour 0)
      expect(series.walkData[0]).toBe(0);
      expect(series.runData[0]).toBe(0);
      expect(series.stairsData[0]).toBe(0);
      expect(series.otherData[0]).toBe(0);
    });
  });

  describe('buildHourlyStepsChartConfig', () => {
    it('builds stacked bar chart configuration with 4 datasets', () => {
      const config = buildHourlyStepsChartConfig(mockHourlyData, false);

      expect(config.type).toBe('bar');
      expect(config.data.labels?.length).toBe(24);
      expect(config.data.datasets.length).toBe(4);

      expect(config.data.datasets[0].label).toBe('Marche');
      expect(config.data.datasets[1].label).toBe('Course');
      expect(config.data.datasets[2].label).toBe('Escaliers');
      expect(config.data.datasets[3].label).toBe('Autre');

      expect(config.options?.scales?.['x']?.stacked).toBe(true);
      expect(config.options?.scales?.['y']?.stacked).toBe(true);
    });

    it('adapts grid and tick colors for dark mode', () => {
      const lightConfig = buildHourlyStepsChartConfig(mockHourlyData, false);
      const darkConfig = buildHourlyStepsChartConfig(mockHourlyData, true);

      expect(darkConfig.options?.scales?.['y']?.grid?.color).toBe('rgba(75, 85, 99, 0.3)');
      expect(lightConfig.options?.scales?.['y']?.grid?.color).toBe('rgba(229, 231, 235, 0.8)');
    });
  });
});
