import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { StudioConfusionMatrix } from '../../../models/telemetry.models';

@Component({
  selector: 'app-studio-models-confusion-matrix',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './studio-models-confusion-matrix.component.html',
})
export class StudioModelsConfusionMatrixComponent {
  readonly matrixData = input<StudioConfusionMatrix | null>(null);

  readonly hoveredCell = signal<{ trueLabel: string; predLabel: string; val: number } | null>(null);

  getCellBgClass(trueIndex: number, predIndex: number, val: number): string {
    const isDiagonal = trueIndex === predIndex;
    if (val >= 0.9) {
      return isDiagonal
        ? 'bg-emerald-600 text-white font-bold'
        : 'bg-red-500 text-white font-bold';
    }
    if (val >= 0.75) {
      return isDiagonal
        ? 'bg-emerald-500 text-white font-semibold'
        : 'bg-red-400 text-white font-semibold';
    }
    if (val >= 0.5) {
      return isDiagonal
        ? 'bg-emerald-400/80 text-gray-900 font-medium'
        : 'bg-amber-300 text-gray-900 font-medium';
    }
    if (val >= 0.2) {
      return 'bg-blue-100 dark:bg-blue-950/60 text-gray-800 dark:text-gray-200';
    }
    if (val > 0) {
      return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    }
    return 'bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 dark:text-gray-600';
  }
}
