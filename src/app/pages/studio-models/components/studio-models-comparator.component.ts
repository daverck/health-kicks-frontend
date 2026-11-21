import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ModelComparisonDeltas } from '../studio-models.store';
import { MLModelDetailResponse, MLModelMetrics } from '../../../models/telemetry.models';

@Component({
  selector: 'app-studio-models-comparator',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './studio-models-comparator.component.html',
})
export class StudioModelsComparatorComponent {
  readonly baseModel = input.required<MLModelDetailResponse>();
  readonly compModel = input.required<MLModelDetailResponse>();
  readonly deltas = input.required<ModelComparisonDeltas>();

  readonly dismiss = output<void>();

  readonly baseF1 = computed(() => {
    const metrics = (this.baseModel().metrics as MLModelMetrics) ?? {};
    return Number(metrics.f1_macro ?? 0);
  });

  readonly compF1 = computed(() => {
    const metrics = (this.compModel().metrics as MLModelMetrics) ?? {};
    return Number(metrics.f1_macro ?? 0);
  });

  readonly baseAccuracy = computed(() => {
    const metrics = (this.baseModel().metrics as MLModelMetrics) ?? {};
    return Number(metrics.accuracy ?? 0);
  });

  readonly compAccuracy = computed(() => {
    const metrics = (this.compModel().metrics as MLModelMetrics) ?? {};
    return Number(metrics.accuracy ?? 0);
  });
}
