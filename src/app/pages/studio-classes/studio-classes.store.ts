import { Injectable, computed, inject, signal } from '@angular/core';
import { StudioService } from '../../core/services/studio.service';
import {
  StudioClassesSummaryResponse,
  StudioClassSummaryItem,
  StudioClassDailyCount,
  StudioClassDetailStatsResponse,
  StudioConfusionMatrix,
} from '../../models/telemetry.models';

export type StudioChartMetric = 'distribution' | 'f1' | 'precision' | 'recall';

@Injectable()
export class StudioClassesStore {
  private readonly studioService = inject(StudioService);

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
  readonly isMatrixExpanded = signal<boolean>(false);

  // Confusion matrix hover state
  readonly hoveredCell = signal<{ trueLabel: string; predLabel: string; value: number } | null>(null);

  // Second section: chronological distribution timeline (expanded by default)
  readonly isTimelineExpanded = signal<boolean>(true);

  // Timeline filtering: 'all' or 'month'
  readonly timelineMode = signal<'all' | 'month'>('all');
  readonly selectedMonth = signal<string>('');

  readonly classes = computed<StudioClassSummaryItem[]>(() => {
    return this.summary()?.classes ?? [];
  });

  readonly confusionMatrix = computed<StudioConfusionMatrix | null>(() => {
    return this.summary()?.confusion_matrix ?? null;
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

  setSelectedClass(label: string | null): void {
    if (label !== this.selectedClass()) {
      this.selectedClass.set(label);
      if (label) {
        this.loadClassStats(label);
      } else {
        this.selectedClassStats.set(null);
        this.adjustMonthSelection();
      }
    }
  }

  setChartMetric(metric: StudioChartMetric): void {
    this.chartMetric.set(metric);
  }

  toggleChartExpansion(): void {
    this.isChartExpanded.update((v) => !v);
  }

  toggleTableExpansion(): void {
    this.isTableExpanded.update((v) => !v);
  }

  toggleMatrixExpansion(): void {
    this.isMatrixExpanded.update((v) => !v);
  }

  toggleTimelineExpansion(): void {
    this.isTimelineExpanded.update((v) => !v);
  }

  setHoveredCell(trueLabel: string, predLabel: string, value: number): void {
    this.hoveredCell.set({ trueLabel, predLabel, value });
  }

  clearHoveredCell(): void {
    this.hoveredCell.set(null);
  }

  setTimelineMode(mode: 'all' | 'month'): void {
    this.timelineMode.set(mode);
    if (mode === 'month') {
      const months = this.availableMonths();
      if (months.length > 0 && (!this.selectedMonth() || !months.includes(this.selectedMonth()))) {
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

  adjustMonthSelection(): void {
    const months = this.availableMonths();
    if (months.length > 0) {
      if (!this.selectedMonth() || !months.includes(this.selectedMonth())) {
        this.selectedMonth.set(months[months.length - 1]);
      }
    }
  }
}
