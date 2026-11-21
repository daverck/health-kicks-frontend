import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-studio-models-firmware-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './studio-models-firmware-card.component.html',
})
export class StudioModelsFirmwareCardComponent {
  readonly flashUsagePct = input<number | null>(null);
  readonly ramUsagePct = input<number | null>(null);
  readonly cHeaderSizeBytes = input<number | null>(null);
  readonly windowSizeSec = input<number>(3.0);
  readonly windowStepSec = input<number>(0.5);

  readonly flashLimitBytes = 3 * 1024 * 1024;
  readonly ramLimitBytes = 320 * 1024;
}
