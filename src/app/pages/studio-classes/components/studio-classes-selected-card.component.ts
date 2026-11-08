import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudioClassSummaryItem } from '../../../models/telemetry.models';
import { ActivityIconComponent } from '../../../shared/components/activity-icon/activity-icon.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-studio-classes-selected-card',
  standalone: true,
  imports: [CommonModule, ActivityIconComponent, TranslatePipe],
  templateUrl: './studio-classes-selected-card.component.html',
})
export class StudioClassesSelectedCardComponent {
  readonly classItem = input.required<StudioClassSummaryItem>();
  readonly formatLabel = input.required<(lbl: string) => string>();
  readonly formatScore = input.required<(val: number | null | undefined) => string>();

  readonly close = output<void>();
}
