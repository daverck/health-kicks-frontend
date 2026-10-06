import {
  Component,
  OnInit,
  computed,
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

export interface CalendarDayItem {
  dayNumber: number;
  dateStr: string;
  totalSteps: number;
  level: number;
  isSelected: boolean;
}

@Component({
  selector: 'app-activity-calendar',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './activity-calendar.component.html',
})
export class ActivityCalendarComponent implements OnInit {
  private readonly stepsService = inject(StepsService);

  readonly deviceId = input.required<string>();
  readonly selectedDate = model<string>(new Date().toISOString().slice(0, 10));
  readonly dateSelected = output<string>();

  readonly currentYear = signal<number>(new Date().getFullYear());
  readonly currentMonth = signal<number>(new Date().getMonth() + 1);

  readonly loading = signal<boolean>(false);
  readonly error = signal<boolean>(false);
  readonly monthSummaries = signal<Record<string, number>>({});

  readonly monthLabel = computed(() => {
    const y = this.currentYear();
    const m = this.currentMonth() - 1;
    const date = new Date(y, m, 1);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  });

  readonly calendarDays = computed<CalendarDayItem[]>(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const daysInMonth = new Date(year, month, 0).getDate();
    const summaries = this.monthSummaries();
    const currentSelected = this.selectedDate();

    const days: CalendarDayItem[] = [];
    const monthStr = month < 10 ? `0${month}` : `${month}`;

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = d < 10 ? `0${d}` : `${d}`;
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      const totalSteps = summaries[dateStr] ?? 0;

      let level = 0;
      if (totalSteps >= 10000) {
        level = 3;
      } else if (totalSteps >= 6000) {
        level = 2;
      } else if (totalSteps >= 2000) {
        level = 1;
      }

      days.push({
        dayNumber: d,
        dateStr,
        totalSteps,
        level,
        isSelected: currentSelected === dateStr,
      });
    }

    return days;
  });

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
    if (this.currentMonth() === 1) {
      this.currentYear.update((y) => y - 1);
      this.currentMonth.set(12);
    } else {
      this.currentMonth.update((m) => m - 1);
    }
    this.loadMonthlyData();
  }

  nextMonth(): void {
    if (this.currentMonth() === 12) {
      this.currentYear.update((y) => y + 1);
      this.currentMonth.set(1);
    } else {
      this.currentMonth.update((m) => m + 1);
    }
    this.loadMonthlyData();
  }

  selectDay(dateStr: string): void {
    this.selectedDate.set(dateStr);
    this.dateSelected.emit(dateStr);
  }

  getDayClass(day: CalendarDayItem): string {
    let base = 'transition-all cursor-pointer rounded-lg p-1.5 text-center flex flex-col items-center justify-center ';

    if (day.isSelected) {
      base += 'ring-2 ring-primary-500 ring-offset-2 ';
    }

    switch (day.level) {
      case 3:
        return base + 'bg-emerald-600 text-white font-bold shadow-sm hover:bg-emerald-700';
      case 2:
        return base + 'bg-emerald-300 text-emerald-950 font-semibold hover:bg-emerald-400';
      case 1:
        return base + 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200';
      default:
        return base + 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    }
  }
}
