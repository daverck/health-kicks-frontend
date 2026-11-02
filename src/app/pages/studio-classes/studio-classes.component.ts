import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
  effect,
  ElementRef,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { StudioService } from '../../core/services/studio.service';
import {
  StudioClassesSummaryResponse,
  StudioClassSummaryItem,
  StudioClassDailyCount,
  StudioClassDetailStatsResponse,
} from '../../models/telemetry.models';
import { ActivityIconComponent } from '../../shared/components/activity-icon/activity-icon.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

Chart.register(...registerables);

export type StudioChartMetric = 'distribution' | 'f1' | 'precision' | 'recall';

@Component({
  selector: 'app-studio-classes',
  standalone: true,
  imports: [CommonModule, ActivityIconComponent, TranslatePipe],
  templateUrl: './studio-classes.component.html',
})
export class StudioClassesComponent implements OnInit {
  private readonly studioService = inject(StudioService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');
  readonly timelineCanvas = viewChild<ElementRef<HTMLCanvasElement>>('timelineCanvas');
  private chartInstance: Chart | null = null;
  private timelineInstance: Chart | null = null;

  readonly isLoading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly summary = signal<StudioClassesSummaryResponse | null>(null);

  // Selected class state
  readonly selectedClass = signal<string | null>(null);
  readonly selectedClassStats = signal<StudioClassDetailStatsResponse | null>(null);
  readonly isLoadingClassStats = signal<boolean>(false);

  // Active metric for class overview chart ('distribution', 'f1', 'precision', 'recall')
  readonly chartMetric = signal<StudioChartMetric>('distribution');

  // Expansion panel states (distribution bar chart and comparative table, collapsed by default)
  readonly isChartExpanded = signal<boolean>(false);
  readonly isTableExpanded = signal<boolean>(false);

  // Second section: chronological distribution timeline (expanded by default)
  readonly isTimelineExpanded = signal<boolean>(true);

  // Timeline filtering: 'all' or 'month'
  readonly timelineMode = signal<'all' | 'month'>('all');
  readonly selectedMonth = signal<string>('');

  readonly classes = computed<StudioClassSummaryItem[]>(() => {
    return this.summary()?.classes ?? [];
  });

  readonly sortedClasses = computed<StudioClassSummaryItem[]>(() => {
    return [...this.classes()].sort((a, b) => b.total_sessions - a.total_sessions);
  });

  readonly selectedClassSummary = computed<StudioClassSummaryItem | null>(() => {
    const lbl = this.selectedClass();
    if (!lbl) return null;
    return this.classes().find((c) => c.label === lbl) ?? null;
  });

  // Source daily counts depending on whether a class is selected or not
  readonly activeDailyCounts = computed<StudioClassDailyCount[]>(() => {
    const lbl = this.selectedClass();
    if (lbl) {
      return this.selectedClassStats()?.daily_counts ?? [];
    }
    return this.summary()?.daily_counts ?? [];
  });

  // Unique sorted list of months found in activeDailyCounts (e.g. ['2026-09', '2026-10', '2026-11'])
  readonly availableMonths = computed<string[]>(() => {
    const counts = this.activeDailyCounts();
    const monthsSet = new Set<string>();
    for (const item of counts) {
      if (item.date && item.date.length >= 7) {
        monthsSet.add(item.date.substring(0, 7));
      }
    }
    return Array.from(monthsSet).sort();
  });

  // Timeline daily counts filtered by timelineMode and selectedMonth
  readonly filteredDailyCounts = computed<StudioClassDailyCount[]>(() => {
    const counts = this.activeDailyCounts();
    if (this.timelineMode() === 'month') {
      const month = this.selectedMonth();
      if (!month) return counts;
      return counts.filter((d) => d.date.startsWith(month));
    }
    return counts;
  });

  // Current month index and navigation state
  readonly currentMonthIndex = computed<number>(() => {
    return this.availableMonths().indexOf(this.selectedMonth());
  });

  readonly hasPreviousMonth = computed<boolean>(() => {
    return this.currentMonthIndex() > 0;
  });

  readonly hasNextMonth = computed<boolean>(() => {
    const idx = this.currentMonthIndex();
    return idx >= 0 && idx < this.availableMonths().length - 1;
  });

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
      if (classParam !== this.selectedClass()) {
        this.selectedClass.set(classParam);
        if (classParam) {
          this.loadClassStats(classParam);
        } else {
          this.selectedClassStats.set(null);
          this.adjustMonthSelection();
        }
      }
    });

    this.loadSummary();
  }

  loadSummary(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.studioService.getClassesSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.isLoading.set(false);
        this.adjustMonthSelection();
      },
      error: (err) => {
        this.error.set(
          err?.error?.detail || 'Error loading Studio classes summary.'
        );
        this.isLoading.set(false);
      },
    });
  }

  loadClassStats(label: string): void {
    this.isLoadingClassStats.set(true);
    this.studioService.getClassStats(label).subscribe({
      next: (data) => {
        this.selectedClassStats.set(data);
        this.isLoadingClassStats.set(false);
        this.adjustMonthSelection();
      },
      error: () => {
        this.isLoadingClassStats.set(false);
      },
    });
  }

  setChartMetric(metric: StudioChartMetric): void {
    this.chartMetric.set(metric);
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
    const next = !this.isChartExpanded();
    this.isChartExpanded.set(next);
    if (next) {
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
    this.isTableExpanded.update((v) => !v);
  }

  toggleTimelineExpansion(): void {
    const next = !this.isTimelineExpanded();
    this.isTimelineExpanded.set(next);
    if (next) {
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
    this.timelineMode.set(mode);
    if (mode === 'month') {
      const months = this.availableMonths();
      if (months.length > 0 && (!this.selectedMonth() || !months.includes(this.selectedMonth()))) {
        // Default to latest month
        this.selectedMonth.set(months[months.length - 1]);
      }
    }
  }

  selectMonth(month: string): void {
    this.selectedMonth.set(month);
    this.timelineMode.set('month');
  }

  goToPreviousMonth(): void {
    const idx = this.currentMonthIndex();
    if (idx > 0) {
      this.selectedMonth.set(this.availableMonths()[idx - 1]);
    }
  }

  goToNextMonth(): void {
    const idx = this.currentMonthIndex();
    const months = this.availableMonths();
    if (idx >= 0 && idx < months.length - 1) {
      this.selectedMonth.set(months[idx + 1]);
    }
  }

  private adjustMonthSelection(): void {
    const months = this.availableMonths();
    if (months.length > 0) {
      if (!this.selectedMonth() || !months.includes(this.selectedMonth())) {
        this.selectedMonth.set(months[months.length - 1]);
      }
    }
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
