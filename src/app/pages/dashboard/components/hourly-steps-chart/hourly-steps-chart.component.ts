import {
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
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
  ChartConfiguration,
} from 'chart.js';
import { StepsService } from '../../../../core/services/steps.service';
import { HourlyStepItem } from '../../../../models/steps.models';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

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
    if (!this.chartCanvas) return;
    this.destroyChart();

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

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Marche',
            data: walkData,
            backgroundColor: '#3b82f6',
            borderRadius: 2,
            stack: 'steps',
          },
          {
            label: 'Course',
            data: runData,
            backgroundColor: '#f97316',
            borderRadius: 2,
            stack: 'steps',
          },
          {
            label: 'Escaliers',
            data: stairsData,
            backgroundColor: '#14b8a6',
            borderRadius: 2,
            stack: 'steps',
          },
          {
            label: 'Autre',
            data: otherData,
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
              color: '#6b7280',
            },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            grid: { color: 'rgba(0, 0, 0, 0.05)' },
            ticks: {
              font: { size: 10 },
              color: '#6b7280',
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
              color: '#374151',
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
