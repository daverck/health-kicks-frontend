import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudioConfusionMatrix } from '../../../models/telemetry.models';
import { ActivityIconComponent } from '../../../shared/components/activity-icon/activity-icon.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-studio-classes-confusion-matrix',
  standalone: true,
  imports: [CommonModule, ActivityIconComponent, TranslatePipe],
  templateUrl: './studio-classes-confusion-matrix.component.html',
})
export class StudioClassesConfusionMatrixComponent {
  readonly confusionMatrix = input.required<StudioConfusionMatrix>();
  readonly isMatrixExpanded = input.required<boolean>();
  readonly hoveredCell = input<{ trueLabel: string; predLabel: string; value: number } | null>(null);
  readonly formatLabel = input.required<(lbl: string) => string>();
  readonly getCellBgClass = input.required<(val: number, isDiag: boolean) => string>();

  readonly toggleExpansion = output<void>();
  readonly cellHover = output<{ trueLabel: string; predLabel: string; value: number }>();
  readonly clearHover = output<void>();
}
