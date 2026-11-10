import {
  Component,
  OnInit,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { StepsService } from '../../../../core/services/steps.service';
import { DailyStepsSummary } from '../../../../models/steps.models';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { formatLocalDateToYmd, formatMonthYear } from '../../../../shared/formatters/date.formatters';
import {
  type CalendarDayItem,
  buildCalendarDays,
  getCalendarDayClass,
  resolveNextMonth,
  resolvePreviousMonth,
} from './activity-calendar.factory';

export type { CalendarDayItem };

@Component({
  selector: 'app-activity-calendar',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './activity-calendar.component.html',
  host: { class: 'block h-full' },
})
export class ActivityCalendarComponent implements OnInit {
  private readonly stepsService = inject(StepsService);

  readonly deviceId = input.required<string>();
  readonly selectedDate = model<string>(formatLocalDateToYmd());
  readonly dateSelected = output<string>();

  readonly currentYear = signal<number>(new Date().getFullYear());
  readonly currentMonth = signal<number>(new Date().getMonth() + 1);

  readonly loading = signal<boolean>(false);
  readonly error = signal<boolean>(false);
  readonly monthSummaries = signal<Record<string, number>>({});

  constructor() {
    effect(() => {
      const devId = this.deviceId();
      if (devId) {
        this.loadMonthlyData();
      }
    });
  }

  readonly monthLabel = computed(() => {
    const y = this.currentYear();
    const m = this.currentMonth() - 1;
    const date = new Date(y, m, 1);
    return formatMonthYear(date);
  });

  readonly calendarDays = computed<CalendarDayItem[]>(() =>
    buildCalendarDays(
      this.currentYear(),
      this.currentMonth(),
      this.monthSummaries(),
      this.selectedDate()
    )
  );

  ngOnInit(): void {
    this.loadMonthlyData();
  }

  loadMonthlyData(): void {
    const devId = this.deviceId();
    if (!devId) return;

    this.loading.set(true);
    this.error.set(false);

    this.stepsService
      .getMonthlyStepsSummary(devId, this.currentYear(), this.currentMonth())
      .subscribe({
        next: (summaries: DailyStepsSummary[]) => {
          const map: Record<string, number> = {};
          for (const item of summaries) {
            map[item.date] = item.total_steps;
          }
          this.monthSummaries.set(map);
          this.loading.set(false);
        },
        error: () => {
          this.monthSummaries.set({});
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  prevMonth(): void {
    const { year, month } = resolvePreviousMonth(this.currentYear(), this.currentMonth());
    this.currentYear.set(year);
    this.currentMonth.set(month);
    this.loadMonthlyData();
  }

  nextMonth(): void {
    const { year, month } = resolveNextMonth(this.currentYear(), this.currentMonth());
    this.currentYear.set(year);
    this.currentMonth.set(month);
    this.loadMonthlyData();
  }

  selectDay(dateStr: string): void {
    this.selectedDate.set(dateStr);
    this.dateSelected.emit(dateStr);
  }

  getDayClass(day: CalendarDayItem): string {
    return getCalendarDayClass(day);
  }
}
