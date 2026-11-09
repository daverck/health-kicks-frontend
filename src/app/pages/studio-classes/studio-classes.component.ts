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
import {
  formatClassLabel,
  createDistributionChartConfig,
  createTimelineChartConfig,
} from './studio-classes-chart.factory';

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
    return formatClassLabel(lbl);
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

    const config = createDistributionChartConfig({
      classes,
      selectedClass,
      metric,
      onSelectClass: (label) => this.selectClass(label),
    });

    this.chartInstance = new Chart(canvas, config);
  }

  private renderTimelineChart(dailyCounts: StudioClassDailyCount[], canvas: HTMLCanvasElement): void {
    if (this.timelineInstance) {
      this.timelineInstance.destroy();
      this.timelineInstance = null;
    }

    const config = createTimelineChartConfig(dailyCounts);
    this.timelineInstance = new Chart(canvas, config);
  }
}
