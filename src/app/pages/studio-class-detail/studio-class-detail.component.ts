import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ChartConfiguration,
} from 'chart.js';
import { StudioService } from '../../core/services/studio.service';
import { StudioClassDetailStatsResponse } from '../../models/telemetry.models';
import { ActivityIconComponent } from '../../shared/components/activity-icon/activity-icon.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

// Register Bar chart elements
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

@Component({
  selector: 'app-studio-class-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ActivityIconComponent, TranslatePipe],
  templateUrl: './studio-class-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudioClassDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly studioService = inject(StudioService);

  @ViewChild('chartCanvas') chartCanvas?: ElementRef<HTMLCanvasElement>;

  readonly label = signal<string>('');
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly stats = signal<StudioClassDetailStatsResponse | null>(null);

  private chart: Chart | null = null;

  readonly precisionPct = computed(() => {
    const val = this.stats()?.ml_metrics.precision ?? 0;
    return (val * 100).toFixed(1);
  });

  readonly recallPct = computed(() => {
    const val = this.stats()?.ml_metrics.recall ?? 0;
    return (val * 100).toFixed(1);
  });

  readonly f1Pct = computed(() => {
    const val = this.stats()?.ml_metrics.f1_score ?? 0;
    return (val * 100).toFixed(1);
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const lbl = params.get('label') || '';
      this.label.set(lbl);
      this.loadStats(lbl);
    });
  }

  ngAfterViewInit(): void {
    if (this.stats()) {
      this.renderChart();
    }
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  loadStats(label: string): void {
    if (!label) return;
    this.loading.set(true);
    this.error.set(null);

    this.studioService.getClassStats(label).subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
        setTimeout(() => this.renderChart(), 0);
      },
      error: (err) => {
        this.error.set(err?.message || 'Erreur lors du chargement des statistiques');
        this.loading.set(false);
      },
    });
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  private renderChart(): void {
    if (!this.chartCanvas?.nativeElement) return;
    this.destroyChart();

    const data = this.stats();
    if (!data || !data.daily_counts || data.daily_counts.length === 0) return;

    const labels = data.daily_counts.map((d) => d.date);
    const validatedCounts = data.daily_counts.map((d) => d.validated_count);
    const pendingCounts = data.daily_counts.map((d) => d.pending_count);

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Validées',
            data: validatedCounts,
            backgroundColor: 'rgba(16, 185, 129, 0.85)', // emerald-500
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 1,
            borderRadius: 6,
          },
          {
            label: 'En attente',
            data: pendingCounts,
            backgroundColor: 'rgba(245, 158, 11, 0.85)', // amber-500
            borderColor: 'rgb(245, 158, 11)',
            borderWidth: 1,
            borderRadius: 6,
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
              font: { size: 11 },
              maxRotation: 45,
            },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              font: { size: 11 },
            },
            grid: {
              color: 'rgba(156, 163, 175, 0.15)',
            },
          },
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              font: { size: 12, weight: 'bold' },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            padding: 10,
            cornerRadius: 8,
          },
        },
      },
    };

    this.chart = new Chart(this.chartCanvas.nativeElement, config);
  }
}

