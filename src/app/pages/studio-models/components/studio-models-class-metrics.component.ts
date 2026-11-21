import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { StudioClassMlMetrics } from '../../../models/telemetry.models';

interface ClassMetricRow {
  label: string;
  precision: number;
  recall: number;
  f1Score: number;
  supportWindows: number;
}

@Component({
  selector: 'app-studio-models-class-metrics',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './studio-models-class-metrics.component.html',
})
export class StudioModelsClassMetricsComponent {
  readonly classMetrics = input.required<Record<string, StudioClassMlMetrics>>();

  readonly rows = computed<ClassMetricRow[]>(() => {
    const metrics = this.classMetrics();
    return Object.entries(metrics)
      .map(([label, m]) => ({
        label,
        precision: m.precision ?? 0,
        recall: m.recall ?? 0,
        f1Score: m.f1_score ?? 0,
        supportWindows: m.support_windows ?? 0,
      }))
      .sort((a, b) => b.f1Score - a.f1Score);
  });
}
