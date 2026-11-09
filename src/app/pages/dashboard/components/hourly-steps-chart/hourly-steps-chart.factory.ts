import { ChartConfiguration } from 'chart.js';
import { HourlyStepItem } from '../../../../models/steps.models';

export interface HourlyActivitySeries {
  labels: string[];
  walkData: number[];
  runData: number[];
  stairsData: number[];
  otherData: number[];
}

/**
 * Builds 24-hour activity datasets from hourly step items.
 */
export function buildHourlyActivitySeries(data: HourlyStepItem[]): HourlyActivitySeries {
  const hourMap = new Map<number, HourlyStepItem>();
  for (const item of data) {
    hourMap.set(item.hour, item);
  }

  const labels: string[] = [];
  const walkData: number[] = [];
  const runData: number[] = [];
  const stairsData: number[] = [];
  const otherData: number[] = [];

  for (let h = 0; h < 24; h++) {
    labels.push(`${h < 10 ? '0' + h : h}:00`);
    const item = hourMap.get(h);
    if (item && item.by_activity) {
      walkData.push(item.by_activity['walk'] ?? 0);
      runData.push(item.by_activity['run'] ?? 0);
      stairsData.push(item.by_activity['stairs'] ?? 0);
      otherData.push(item.by_activity['unclassified'] ?? 0);
    } else {
      walkData.push(0);
      runData.push(0);
      stairsData.push(0);
      otherData.push(0);
    }
  }

  return { labels, walkData, runData, stairsData, otherData };
}

/**
 * Constructs the Chart.js configuration for hourly stacked bar charts.
 */
export function buildHourlyStepsChartConfig(
  data: HourlyStepItem[],
  isDark = false
): ChartConfiguration<'bar'> {
  const gridColor = isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.8)';
  const tickColor = isDark ? '#9ca3af' : '#6b7280';
  const legendColor = isDark ? '#e5e7eb' : '#374151';

  const series = buildHourlyActivitySeries(data);

  return {
    type: 'bar',
    data: {
      labels: series.labels,
      datasets: [
        {
          label: 'Marche',
          data: series.walkData,
          backgroundColor: '#3b82f6',
          borderRadius: 2,
          stack: 'steps',
        },
        {
          label: 'Course',
          data: series.runData,
          backgroundColor: '#f97316',
          borderRadius: 2,
          stack: 'steps',
        },
        {
          label: 'Escaliers',
          data: series.stairsData,
          backgroundColor: '#14b8a6',
          borderRadius: 2,
          stack: 'steps',
        },
        {
          label: 'Autre',
          data: series.otherData,
          backgroundColor: '#9ca3af',
          borderRadius: 2,
          stack: 'steps',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: {
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 12,
            font: { size: 10 },
            color: tickColor,
          },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          grid: { color: gridColor },
          ticks: {
            font: { size: 10 },
            color: tickColor,
          },
        },
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            boxWidth: 12,
            font: { size: 11 },
            color: legendColor,
          },
        },
        tooltip: {
          backgroundColor: '#1f2937',
          titleFont: { size: 12 },
          bodyFont: { size: 11 },
          padding: 8,
        },
      },
    },
  };
}
