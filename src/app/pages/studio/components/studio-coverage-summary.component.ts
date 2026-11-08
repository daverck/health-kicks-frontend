import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-studio-coverage-summary',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './studio-coverage-summary.component.html',
})
export class StudioCoverageSummaryComponent {
  @Input({ required: true }) totalSessions = 0;
  @Input({ required: true }) classesReachingTarget = 0;
  @Input({ required: true }) totalPredefinedClasses = 0;
  @Input({ required: true }) targetPerClass = 25;
  @Input() isLoadingStats = false;
}
