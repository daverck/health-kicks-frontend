import {
  Component,
  OnInit,
  inject,
  effect,
  ElementRef,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import {
  StudioClassSummaryItem,
  StudioClassDailyCount,
} from '../../models/telemetry.models';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { StudioClassesKpiCardsComponent } from './components/studio-classes-kpi-cards.component';
import { StudioClassesTableComponent } from './components/studio-classes-table.component';
import { StudioClassesConfusionMatrixComponent } from './components/studio-classes-confusion-matrix.component';
import { StudioClassesSelectedCardComponent } from './components/studio-classes-selected-card.component';
import { StudioClassesStore, StudioChartMetric } from './studio-classes.store';

Chart.register(...registerables);

export type { StudioChartMetric };

@Component({
  selector: 'app-studio-classes',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    StudioClassesKpiCardsComponent,
    StudioClassesTableComponent,
    StudioClassesConfusionMatrixComponent,
    StudioClassesSelectedCardComponent,
  ],
  providers: [StudioClassesStore],
  templateUrl: './studio-classes.component.html',
})
export class StudioClassesComponent implements OnInit {
  private readonly store = inject(StudioClassesStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');
  readonly timelineCanvas = viewChild<ElementRef<HTMLCanvasElement>>('timelineCanvas');
  private chartInstance: Chart | null = null;
  private timelineInstance: Chart | null = null;

  // Delegated signals and state from StudioClassesStore
  readonly isLoading = this.store.isLoading;
  readonly error = this.store.error;
  readonly summary = this.store.summary;

  readonly selectedClass = this.store.selectedClass;
  readonly selectedClassStats = this.store.selectedClassStats;
  readonly isLoadingClassStats = this.store.isLoadingClassStats;

  readonly chartMetric = this.store.chartMetric;

  readonly isChartExpanded = this.store.isChartExpanded;
  readonly isTableExpanded = this.store.isTableExpanded;
  readonly isMatrixExpanded = this.store.isMatrixExpanded;

  readonly hoveredCell = this.store.hoveredCell;

  readonly isTimelineExpanded = this.store.isTimelineExpanded;

  readonly timelineMode = this.store.timelineMode;
  readonly selectedMonth = this.store.selectedMonth;

  readonly classes = this.store.classes;
  readonly confusionMatrix = this.store.confusionMatrix;
  readonly sortedClasses = this.store.sortedClasses;
  readonly selectedClassSummary = this.store.selectedClassSummary;
  readonly activeDailyCounts = this.store.activeDailyCounts;
  readonly availableMonths = this.store.availableMonths;
  readonly filteredDailyCounts = this.store.filteredDailyCounts;
  readonly currentMonthIndex = this.store.currentMonthIndex;
  readonly hasPreviousMonth = this.store.hasPreviousMonth;
  readonly hasNextMonth = this.store.hasNextMonth;

  constructor() {
    // Render distribution chart when summary is loaded and canvas is ready
    effect(() => {
      const summaryData = this.summary();
      const canvasRef = this.chartCanvas();
      const selected = this.selectedClass();
      const metric = this.chartMetric();
      if (summaryData && canvasRef?.nativeElement) {
        this.renderDistributionChart(summaryData.classes, canvasRef.nativeElement, selected, metric);
      }
    });

    // Render timeline chart when filteredDailyCounts or timelineCanvas changes
    effect(() => {
      const daily = this.filteredDailyCounts();
      const canvasRef = this.timelineCanvas();
      const expanded = this.isTimelineExpanded();
      if (expanded && canvasRef?.nativeElement) {
        this.renderTimelineChart(daily, canvasRef.nativeElement);
      }
    });
  }

  ngOnInit(): void {
    // Listen to query parameters (?class=...)
    this.route.queryParamMap.subscribe((params) => {
      const classParam = params.get('class');
      this.store.setSelectedClass(classParam);
    });

    this.store.loadSummary();
  }

  loadSummary(): void {
    this.store.loadSummary();
  }

  loadClassStats(label: string): void {
    this.store.loadClassStats(label);
  }

  setChartMetric(metric: StudioChartMetric): void {
    this.store.setChartMetric(metric);
    if (this.isChartExpanded()) {
      setTimeout(() => {
        const summaryData = this.summary();
        const canvasRef = this.chartCanvas();
        const selected = this.selectedClass();
        if (summaryData && canvasRef?.nativeElement) {
          this.renderDistributionChart(summaryData.classes, canvasRef.nativeElement, selected, metric);
        }
      }, 0);
    }
  }

  toggleChartExpansion(): void {
    this.store.toggleChartExpansion();
    if (this.isChartExpanded()) {
      setTimeout(() => {
        const summaryData = this.summary();
        const canvasRef = this.chartCanvas();
        const selected = this.selectedClass();
        const metric = this.chartMetric();
        if (summaryData && canvasRef?.nativeElement) {
          this.renderDistributionChart(summaryData.classes, canvasRef.nativeElement, selected, metric);
        }
      }, 0);
    }
  }

  toggleTableExpansion(): void {
    this.store.toggleTableExpansion();
  }

  toggleMatrixExpansion(): void {
    this.store.toggleMatrixExpansion();
  }

  setHoveredCell(trueLabel: string, predLabel: string, value: number): void {
    this.store.setHoveredCell(trueLabel, predLabel, value);
  }

  clearHoveredCell(): void {
    this.store.clearHoveredCell();
  }

  getMatrixCellBgClass(value: number, isDiagonal: boolean): string {
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

  toggleTimelineExpansion(): void {
    this.store.toggleTimelineExpansion();
    if (this.isTimelineExpanded()) {
      setTimeout(() => {
        const daily = this.filteredDailyCounts();
        const canvasRef = this.timelineCanvas();
        if (canvasRef?.nativeElement) {
          this.renderTimelineChart(daily, canvasRef.nativeElement);
        }
      }, 0);
    }
  }

  selectClass(label: string | null): void {
    if (this.selectedClass() === label) {
      // Toggle off if already selected
      label = null;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: label ? { class: label } : {},
      replaceUrl: false,
    });
  }

  setTimelineMode(mode: 'all' | 'month'): void {
    this.store.setTimelineMode(mode);
  }

  selectMonth(month: string): void {
    this.store.selectMonth(month);
  }

  goToPreviousMonth(): void {
    this.store.goToPreviousMonth();
  }

  goToNextMonth(): void {
    this.store.goToNextMonth();
  }

  formatLabel(lbl: string): string {
    return lbl.replace(/_/g, ' ').toUpperCase();
  }

  formatMonth(monthStr: string): string {
    if (!monthStr || monthStr.length < 7) return monthStr;
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  formatScore(val: number | null | undefined): string {
    if (val === null || val === undefined || isNaN(val)) return '—';
    return (val * 100).toFixed(1) + '%';
  }

  private renderDistributionChart(
    classes: StudioClassSummaryItem[],
    canvas: HTMLCanvasElement,
    selectedClass: string | null,
    metric: StudioChartMetric
  ): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    // Sort order: by sessions for distribution, or by corresponding score descending
    const sortedForChart = [...classes].sort((a, b) => {
      if (metric === 'f1') return b.f1_score - a.f1_score;
      if (metric === 'precision') return b.precision - a.precision;
      if (metric === 'recall') return b.recall - a.recall;
      return b.total_sessions - a.total_sessions;
    });

    const labels = sortedForChart.map((c) => this.formatLabel(c.label));

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

      this.chartInstance = new Chart(canvas, {
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
            if (elements.length > 0) {
              const idx = elements[0].index;
              const clickedClass = sortedForChart[idx]?.label;
              if (clickedClass) {
                this.selectClass(clickedClass);
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
                    `ML Precision: ${(item.precision * 100).toFixed(1)}%`,
                    `ML Recall: ${(item.recall * 100).toFixed(1)}%`,
                    `F1-Score: ${(item.f1_score * 100).toFixed(1)}%`,
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
      });
      return;
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

    this.chartInstance = new Chart(canvas, {
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
          if (elements.length > 0) {
            const idx = elements[0].index;
            const clickedClass = sortedForChart[idx]?.label;
            if (clickedClass) {
              this.selectClass(clickedClass);
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
                  `F1-Score: ${(item.f1_score * 100).toFixed(1)}%`,
                  `Precision: ${(item.precision * 100).toFixed(1)}%`,
                  `Recall: ${(item.recall * 100).toFixed(1)}%`,
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
    });
  }

  private renderTimelineChart(dailyCounts: StudioClassDailyCount[], canvas: HTMLCanvasElement): void {
    if (this.timelineInstance) {
      this.timelineInstance.destroy();
      this.timelineInstance = null;
    }

    const labels = dailyCounts.map((d) => d.date);
    const validatedData = dailyCounts.map((d) => d.validated_count);
    const pendingData = dailyCounts.map((d) => d.pending_count);

    this.timelineInstance = new Chart(canvas, {
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
    });
  }
}
