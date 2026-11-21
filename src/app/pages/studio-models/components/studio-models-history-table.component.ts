import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { MLModelSummaryResponse } from '../../../models/telemetry.models';

@Component({
  selector: 'app-studio-models-history-table',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './studio-models-history-table.component.html',
})
export class StudioModelsHistoryTableComponent {
  readonly models = input.required<MLModelSummaryResponse[]>();
  readonly selectedVersion = input<string | null>(null);
  readonly comparatorVersion = input<string | null>(null);

  readonly inspect = output<string>();
  readonly compare = output<string>();
  readonly removeCompare = output<void>();
}
