import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-studio-countdown-state',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './studio-countdown-state.component.html',
})
export class StudioCountdownStateComponent {
  @Output() cancel = new EventEmitter<void>();

  onCancel(): void {
    this.cancel.emit();
  }
}
