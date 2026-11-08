import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudioSessionSummary } from '../../../models/studio-history.model';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-studio-history-mobile-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './studio-history-mobile-card.component.html',
})
export class StudioHistoryMobileCardComponent {
  @Input({ required: true }) session!: StudioSessionSummary;
  @Input({ required: true }) isInspecting = false;
  @Input({ required: true }) labelBadgeClass = '';
  @Input({ required: true }) labelIcon = '🏃';
  @Input({ required: true }) labelDisplayName = '';
  @Input({ required: true }) isEdgeAi = false;
  @Input({ required: true }) isCustomLabel = false;
  @Input() isAdmin = false;
  @Input() authorDisplayName = '';

  @Output() inspect = new EventEmitter<StudioSessionSummary>();
  @Output() delete = new EventEmitter<{ session: StudioSessionSummary; event: MouseEvent }>();

  onDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.delete.emit({ session: this.session, event });
  }

  onInspect(event: MouseEvent): void {
    event.stopPropagation();
    this.inspect.emit(this.session);
  }
}
