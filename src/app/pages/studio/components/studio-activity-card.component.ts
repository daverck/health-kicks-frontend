import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityIconComponent } from '../../../shared/components/activity-icon/activity-icon.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

export interface StudioLabelItem {
  id: string;
  name: string;
  desc: string;
}

@Component({
  selector: 'app-studio-activity-card',
  standalone: true,
  imports: [CommonModule, ActivityIconComponent, TranslatePipe],
  templateUrl: './studio-activity-card.component.html',
})
export class StudioActivityCardComponent {
  @Input({ required: true }) label!: StudioLabelItem;
  @Input({ required: true }) isSelected = false;
  @Input({ required: true }) isEdgeAi = false;
  @Input({ required: true }) totalCount = 0;
  @Input({ required: true }) validatedCount = 0;
  @Input({ required: true }) pendingCount = 0;
  @Input({ required: true }) targetPerClass = 25;

  @Output() selectActivity = new EventEmitter<string>();
  @Output() filterValidated = new EventEmitter<{ event: MouseEvent; labelId: string }>();
  @Output() filterPending = new EventEmitter<{ event: MouseEvent; labelId: string }>();

  onSelect(): void {
    this.selectActivity.emit(this.label.id);
  }

  onFilterValidated(event: MouseEvent): void {
    event.stopPropagation();
    this.filterValidated.emit({ event, labelId: this.label.id });
  }

  onFilterPending(event: MouseEvent): void {
    event.stopPropagation();
    this.filterPending.emit({ event, labelId: this.label.id });
  }
}
