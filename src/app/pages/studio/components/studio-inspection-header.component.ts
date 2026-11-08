import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-studio-inspection-header',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './studio-inspection-header.component.html',
})
export class StudioInspectionHeaderComponent {
  @Input({ required: true }) labelDisplayName = '';
  @Input() sessionId?: string;
  @Input({ required: true }) selectedDeviceId = '';
  @Input({ required: true }) readingsCount = 0;
  @Input() isRefreshingReadings = false;
  @Input() isDeleting = false;
  @Input() isValidating = false;

  @Output() refreshReadings = new EventEmitter<void>();
  @Output() exportJson = new EventEmitter<void>();
  @Output() rejectSession = new EventEmitter<void>();
  @Output() validateSession = new EventEmitter<void>();
}
