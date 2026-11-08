import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-studio-classes-kpi-cards',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './studio-classes-kpi-cards.component.html',
})
export class StudioClassesKpiCardsComponent {
  readonly totalClasses = input.required<number>();
  readonly totalSessions = input.required<number>();
  readonly validatedSessions = input.required<number>();
  readonly pendingSessions = input.required<number>();
  readonly macroPrecision = input.required<number>();
  readonly macroRecall = input.required<number>();
  readonly macroF1 = input.required<number>();
  readonly formatScore = input.required<(val: number | null | undefined) => string>();
}
