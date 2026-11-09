import {
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
} from 'chart.js';
import { StepsService } from '../../../../core/services/steps.service';
import { HourlyStepItem } from '../../../../models/steps.models';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { formatLongLocalDate } from '../../../../shared/formatters/date.formatters';
import { buildHourlyStepsChartConfig } from './hourly-steps-chart.factory';

// Register required Chart.js modules
Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip
);

@Component({
  selector: 'app-hourly-steps-chart',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './hourly-steps-chart.component.html',
  host: { class: 'block h-full' },
})
export class HourlyStepsChartComponent implements OnDestroy {
  private readonly stepsService = inject(StepsService);

  readonly deviceId = input.required<string>();
  readonly date = input.required<string>();

  @ViewChild('chartCanvas') chartCanvas?: ElementRef<HTMLCanvasElement>;

  readonly loading = signal<boolean>(false);
  readonly error = signal<boolean>(false);
  readonly totalDaySteps = signal<number>(0);
  readonly hourlyData = signal<HourlyStepItem[]>([]);

  readonly formattedDate = computed(() => formatLongLocalDate(this.date()));

  private chart?: Chart;

  constructor() {
    effect(() => {
      const id = this.deviceId();
      const dt = this.date();
      if (id && dt) {
        this.fetchHourlyData(id, dt);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  fetchHourlyData(deviceId: string, date: string): void {
    this.loading.set(true);
    this.error.set(false);

    this.stepsService.getHourlySteps(deviceId, date).subscribe({
      next: (res) => {
        const items = res.hourly_data || [];
        this.hourlyData.set(items);
        const total = items.reduce((acc, curr) => acc + (curr.total_steps || 0), 0);
        this.totalDaySteps.set(total);
        this.loading.set(false);
        // Defer chart render until view canvas is updated
        setTimeout(() => this.renderChart(items), 0);
      },
      error: () => {
        this.hourlyData.set([]);
        this.totalDaySteps.set(0);
        this.error.set(true);
        this.loading.set(false);
        this.destroyChart();
      },
    });
  }

  private renderChart(data: HourlyStepItem[]): void {
    if (this.totalDaySteps() === 0) {
      this.destroyChart();
      return;
    }
    if (!this.chartCanvas?.nativeElement) {
      requestAnimationFrame(() => this.renderChart(data));
      return;
    }
    this.destroyChart();

    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    const config = buildHourlyStepsChartConfig(data, isDark);

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (ctx) {
      this.chart = new Chart(ctx, config);
    }
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
  }
}
