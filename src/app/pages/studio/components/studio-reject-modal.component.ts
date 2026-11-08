import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-studio-reject-modal',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './studio-reject-modal.component.html',
})
export class StudioRejectModalComponent {
  @Output() cancel = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();
}
