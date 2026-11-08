import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudioClassSummaryItem } from '../../../models/telemetry.models';
import { ActivityIconComponent } from '../../../shared/components/activity-icon/activity-icon.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-studio-classes-table',
  standalone: true,
  imports: [CommonModule, ActivityIconComponent, TranslatePipe],
  templateUrl: './studio-classes-table.component.html',
})
export class StudioClassesTableComponent {
  readonly classes = input.required<StudioClassSummaryItem[]>();
  readonly selectedClass = input<string | null>(null);
  readonly isTableExpanded = input.required<boolean>();
  readonly formatScore = input.required<(val: number | null | undefined) => string>();
  readonly formatLabel = input.required<(lbl: string) => string>();

  readonly toggleExpansion = output<void>();
  readonly selectClass = output<string>();
}
