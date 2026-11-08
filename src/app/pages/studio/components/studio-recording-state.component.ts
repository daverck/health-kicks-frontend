import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityIconComponent } from '../../../shared/components/activity-icon/activity-icon.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-studio-recording-state',
  standalone: true,
  imports: [CommonModule, ActivityIconComponent, TranslatePipe],
  templateUrl: './studio-recording-state.component.html',
})
export class StudioRecordingStateComponent {
  @Input({ required: true }) effectiveLabel = '';
  @Input({ required: true }) displayLabel = '';
  @Input({ required: true }) progressPercent = 0;
}
