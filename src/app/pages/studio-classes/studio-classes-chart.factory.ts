import { ChartConfiguration } from 'chart.js';
import { formatPercentScore } from '../../shared/formatters/number.formatters';
import {
  StudioClassSummaryItem,
  StudioClassDailyCount,
} from '../../models/telemetry.models';
import { StudioChartMetric } from './studio-classes.store';

/**
 * Formats a snake_case class identifier to human-readable uppercase.
 */
export function formatClassLabel(lbl: string): string {
  return lbl.replace(/_/g, ' ').toUpperCase();
}

export interface DistributionChartParams {
  classes: StudioClassSummaryItem[];
  selectedClass: string | null;
  metric: StudioChartMetric;
  onSelectClass?: (label: string) => void;
}

/**
 * Builds Chart.js configuration for the Studio Classes distribution or metric performance chart.
 */
export function createDistributionChartConfig(
  params: DistributionChartParams
): ChartConfiguration<'bar'> {
  const { classes, selectedClass, metric, onSelectClass } = params;

  // Sort order: by sessions for distribution, or by corresponding score descending
  const sortedForChart = [...classes].sort((a, b) => {
    if (metric === 'f1') return b.f1_score - a.f1_score;
    if (metric === 'precision') return b.precision - a.precision;
    if (metric === 'recall') return b.recall - a.recall;
    return b.total_sessions - a.total_sessions;
  });

  const labels = sortedForChart.map((c) => formatClassLabel(c.label));

  if (metric === 'distribution') {
    const validatedColors = sortedForChart.map((c) => {
      if (selectedClass) {
        return c.label === selectedClass ? '#10B981' : '#A7F3D0';
      }
      return '#10B981';
    });

    const pendingColors = sortedForChart.map((c) => {
      if (selectedClass) {
        return c.label === selectedClass ? '#F59E0B' : '#FDE68A';
      }
      return '#F59E0B';
    });

    const validatedData = sortedForChart.map((c) => c.validated_sessions);
    const pendingData = sortedForChart.map((c) => c.pending_sessions);

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Validated Sessions',
            data: validatedData,
            backgroundColor: validatedColors,
            borderRadius: 4,
          },
          {
            label: 'Pending Sessions',
            data: pendingData,
            backgroundColor: pendingColors,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (_, elements) => {
          if (elements.length > 0 && onSelectClass) {
            const idx = elements[0].index;
            const clickedClass = sortedForChart[idx]?.label;
            if (clickedClass) {
              onSelectClass(clickedClass);
            }
          }
        },
        onHover: (event, elements) => {
          if (event.native?.target) {
            (event.native.target as HTMLElement).style.cursor = elements.length ? 'pointer' : 'default';
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 12, font: { size: 12 } },
          },
          tooltip: {
            callbacks: {
              afterBody: (context) => {
                const idx = context[0]?.dataIndex ?? 0;
                const item = sortedForChart[idx];
                if (!item) return '';
                return [
                  `Total: ${item.total_sessions}`,
                  `Median duration: ${item.median_duration_sec}s`,
                  `ML Precision: ${formatPercentScore(item.precision)}`,
                  `ML Recall: ${formatPercentScore(item.recall)}`,
                  `F1-Score: ${formatPercentScore(item.f1_score)}`,
                  `Latest session: ${item.latest_session_date || 'N/A'}`,
                  '👉 Click to filter timeline',
                ];
              },
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { maxRotation: 45, minRotation: 0, font: { size: 11 } },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: { precision: 0 },
            title: { display: true, text: 'Number of sessions' },
          },
        },
      },
    };
  }

  // Performance metrics: F1, Precision, Recall (percentage 0-100%)
  const metricLabel =
    metric === 'f1' ? 'F1-Score' : metric === 'precision' ? 'Precision' : 'Recall';

  const metricData = sortedForChart.map((c) => {
    const val = metric === 'f1' ? c.f1_score : metric === 'precision' ? c.precision : c.recall;
    return +(val * 100).toFixed(1);
  });

  // Color code based on threshold: Green (>= 85%), Amber (70-84%), Red (< 70%)
  const backgroundColors = sortedForChart.map((c, i) => {
    const score = metricData[i];
    let baseColor = '#10B981'; // Green
    if (score < 70) {
      baseColor = '#EF4444'; // Red
    } else if (score < 85) {
      baseColor = '#F59E0B'; // Amber
    }
    if (selectedClass) {
      return c.label === selectedClass ? baseColor : `${baseColor}66`;
    }
    return baseColor;
  });

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: metricLabel,
          data: metricData,
          backgroundColor: backgroundColors,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      onClick: (_, elements) => {
        if (elements.length > 0 && onSelectClass) {
          const idx = elements[0].index;
          const clickedClass = sortedForChart[idx]?.label;
          if (clickedClass) {
            onSelectClass(clickedClass);
          }
        }
      },
      onHover: (event, elements) => {
        if (event.native?.target) {
          (event.native.target as HTMLElement).style.cursor = elements.length ? 'pointer' : 'default';
        }
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context) => ` ${metricLabel}: ${context.parsed.y}%`,
            afterBody: (context) => {
              const idx = context[0]?.dataIndex ?? 0;
              const item = sortedForChart[idx];
              if (!item) return '';
              return [
                `Sessions: ${item.total_sessions} (${item.validated_sessions} valid)`,
                `F1-Score: ${formatPercentScore(item.f1_score)}`,
                `Precision: ${formatPercentScore(item.precision)}`,
                `Recall: ${formatPercentScore(item.recall)}`,
                '👉 Click to filter timeline',
              ];
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxRotation: 45, minRotation: 0, font: { size: 11 } },
        },
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: (value) => `${value}%`,
          },
          title: { display: true, text: `${metricLabel} (%)` },
        },
      },
    },
  };
}

/**
 * Builds Chart.js configuration for the Studio Classes monthly timeline chart.
 */
export function createTimelineChartConfig(
  dailyCounts: StudioClassDailyCount[]
): ChartConfiguration<'bar'> {
  const labels = dailyCounts.map((d) => d.date);
  const validatedData = dailyCounts.map((d) => d.validated_count);
  const pendingData = dailyCounts.map((d) => d.pending_count);

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Validated',
          data: validatedData,
          backgroundColor: '#10B981',
          borderRadius: 4,
        },
        {
          label: 'Pending',
          data: pendingData,
          backgroundColor: '#F59E0B',
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { boxWidth: 12, font: { size: 12 } },
        },
        tooltip: {
          callbacks: {
            afterBody: (context) => {
              const idx = context[0]?.dataIndex ?? 0;
              const item = dailyCounts[idx];
              if (!item) return '';
              return [`Daily total: ${item.count} sessions`];
            },
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { maxRotation: 45, minRotation: 0, font: { size: 11 } },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: { precision: 0 },
          title: { display: true, text: 'Sessions per day' },
        },
      },
    },
  };
}

/**
 * Resolves Tailwind CSS background and text classes for confusion matrix cells based on value and diagonal status.
 */
export function getConfusionMatrixCellBgClass(value: number, isDiagonal: boolean): string {
  if (value >= 0.95) return 'bg-emerald-600 text-white font-bold';
  if (value >= 0.85) return 'bg-emerald-500 text-white font-semibold';
  if (value >= 0.70) return 'bg-emerald-400 text-gray-900 font-semibold';
  if (value >= 0.50) return 'bg-emerald-300 dark:bg-emerald-700 text-gray-900 dark:text-white';
  if (value >= 0.25) return 'bg-amber-300 dark:bg-amber-700 text-gray-900 dark:text-white';
  if (value >= 0.10) return 'bg-amber-200 dark:bg-amber-800/80 text-gray-800 dark:text-gray-100';
  if (value > 0.01) return 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-200';
  if (value > 0.0) return 'bg-gray-100 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400';
  return isDiagonal
    ? 'bg-red-50 dark:bg-red-950/30 text-gray-400'
    : 'bg-white dark:bg-gray-900 text-gray-300 dark:text-gray-600';
}
