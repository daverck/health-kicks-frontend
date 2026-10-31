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
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { StudioService } from '../../core/services/studio.service';
import {
  StudioClassesSummaryResponse,
  StudioClassSummaryItem,
} from '../../models/telemetry.models';
import { ActivityIconComponent } from '../../shared/components/activity-icon/activity-icon.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

Chart.register(...registerables);

@Component({
  selector: 'app-studio-classes',
  standalone: true,
  imports: [CommonModule, RouterLink, ActivityIconComponent, TranslatePipe],
  templateUrl: './studio-classes.component.html',
})
export class StudioClassesComponent implements OnInit {
  private readonly studioService = inject(StudioService);

  readonly chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');
  private chartInstance: Chart | null = null;

  readonly isLoading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly summary = signal<StudioClassesSummaryResponse | null>(null);

  readonly classes = computed<StudioClassSummaryItem[]>(() => {
    return this.summary()?.classes ?? [];
  });

  readonly sortedClasses = computed<StudioClassSummaryItem[]>(() => {
    return [...this.classes()].sort((a, b) => b.total_sessions - a.total_sessions);
  });

  constructor() {
    effect(() => {
      const summaryData = this.summary();
      const canvasRef = this.chartCanvas();
      if (summaryData && canvasRef?.nativeElement) {
        this.renderChart(summaryData.classes, canvasRef.nativeElement);
      }
    });
  }

  ngOnInit(): void {
    this.loadSummary();
  }

  loadSummary(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.studioService.getClassesSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(
          err?.error?.detail || 'Erreur lors du chargement de la synthèse des classes Studio.'
        );
        this.isLoading.set(false);
      },
    });
  }

  formatLabel(lbl: string): string {
    return lbl.replace(/_/g, ' ').toUpperCase();
  }

  formatScore(val: number | null | undefined): string {
    if (val === null || val === undefined || isNaN(val)) return '—';
    return (val * 100).toFixed(1) + '%';
  }

  private renderChart(classes: StudioClassSummaryItem[], canvas: HTMLCanvasElement): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    const sortedForChart = [...classes].sort((a, b) => b.total_sessions - a.total_sessions);
    const labels = sortedForChart.map((c) => this.formatLabel(c.label));
    const validatedData = sortedForChart.map((c) => c.validated_sessions);
    const pendingData = sortedForChart.map((c) => c.pending_sessions);

    this.chartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Sessions Validées',
            data: validatedData,
            backgroundColor: '#10B981',
            borderRadius: 4,
          },
          {
            label: 'Sessions en Attente',
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
            labels: {
              boxWidth: 12,
              font: { size: 12 },
            },
          },
          tooltip: {
            callbacks: {
              afterBody: (context) => {
                const idx = context[0]?.dataIndex ?? 0;
                const item = sortedForChart[idx];
                if (!item) return '';
                return [
                  `Total: ${item.total_sessions}`,
                  `Durée médiane: ${item.median_duration_sec}s`,
                  `Précision ML: ${(item.precision * 100).toFixed(1)}%`,
                  `Rappel ML: ${(item.recall * 100).toFixed(1)}%`,
                  `Dernière session: ${item.latest_session_date || 'N/A'}`,
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
            title: { display: true, text: 'Nombre de sessions' },
          },
        },
      },
    });
  }
}
