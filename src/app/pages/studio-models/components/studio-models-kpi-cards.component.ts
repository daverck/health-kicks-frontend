import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

export interface ModelKpisData {
  version: string;
  modelName: string;
  isActive: boolean;
  gitCommit: string | null;
  createdAt: string;
  f1Macro: number;
  accuracy: number;
  precisionMacro: number;
  recallMacro: number;
  totalWindows: number;
  totalSessions: number;
  flashUsagePct: number | null;
  ramUsagePct: number | null;
  cHeaderSizeBytes: number | null;
  isTargetF1Met: boolean;
}

@Component({
  selector: 'app-studio-models-kpi-cards',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './studio-models-kpi-cards.component.html',
})
export class StudioModelsKpiCardsComponent {
  readonly kpis = input.required<ModelKpisData>();
}
