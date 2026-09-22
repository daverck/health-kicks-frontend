import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { StepsService } from '../../../../core/services/steps.service';
import { DailyStepsSummary } from '../../../../models/steps.models';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-steps-history',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './steps-history.component.html',
})
export class StepsHistoryComponent implements OnChanges {
  private readonly stepsService = inject(StepsService);

  @Input({ required: true }) deviceId!: string;

  readonly selectedPeriodDays = signal<number>(30);
  readonly history = signal<DailyStepsSummary[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<boolean>(false);

  // Summary Computations
  readonly totalAccumulated = computed(() =>
    this.history().reduce((acc, curr) => acc + curr.total_steps, 0)
  );

  readonly dailyAverage = computed(() => {
    const list = this.history();
    return list.length > 0 ? Math.round(this.totalAccumulated() / list.length) : 0;
  });

  readonly bestDay = computed(() => {
    const list = this.history();
    if (list.length === 0) return null;
    return list.reduce((best, curr) =>
      curr.total_steps > (best?.total_steps ?? 0) ? curr : best
    );
  });

  readonly activityPercentages = computed(() => {
    const totals: Record<string, number> = { walk: 0, run: 0, stairs: 0, unclassified: 0 };
    let grandTotal = 0;

    for (const day of this.history()) {
      for (const [activity, count] of Object.entries(day.by_activity || {})) {
        totals[activity] = (totals[activity] ?? 0) + count;
        grandTotal += count;
      }
    }

    if (grandTotal === 0) {
      return { walk: 0, run: 0, stairs: 0, unclassified: 0 };
    }

    return {
      walk: Math.round(((totals['walk'] ?? 0) / grandTotal) * 100),
      run: Math.round(((totals['run'] ?? 0) / grandTotal) * 100),
      stairs: Math.round(((totals['stairs'] ?? 0) / grandTotal) * 100),
      unclassified: Math.round(((totals['unclassified'] ?? 0) / grandTotal) * 100),
    };
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['deviceId'] && this.deviceId) {
      this.loadHistory();
    }
  }

  setPeriod(days: number): void {
    this.selectedPeriodDays.set(days);
    this.loadHistory();
  }

  loadHistory(): void {
    if (!this.deviceId) return;

    this.loading.set(true);
    this.error.set(false);

    this.stepsService.getStepsHistory(this.deviceId, this.selectedPeriodDays()).subscribe({
      next: (res) => {
        // Sort descending by date for chronological display
        const sorted = [...(res.history || [])].sort((a, b) => b.date.localeCompare(a.date));
        this.history.set(sorted);
        this.loading.set(false);
      },
      error: () => {
        this.history.set([]);
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  getActivityPercent(day: DailyStepsSummary, activity: string): number {
    if (!day.total_steps || day.total_steps === 0) return 0;
    const count = day.by_activity?.[activity] ?? 0;
    return Math.min(100, Math.max(0, (count / day.total_steps) * 100));
  }
}

