import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudioSessionSummary } from '../../../models/studio-history.model';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-studio-history-delete-modal',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './studio-history-delete-modal.component.html',
})
export class StudioHistoryDeleteModalComponent {
  @Input({ required: true }) session!: StudioSessionSummary;

  @Output() cancel = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<string>();
}
