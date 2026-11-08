import { Component, ElementRef, EventEmitter, Input, Output, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivityIconComponent } from '../../../shared/components/activity-icon/activity-icon.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-studio-custom-activity-card',
  standalone: true,
  imports: [CommonModule, FormsModule, ActivityIconComponent, TranslatePipe],
  templateUrl: './studio-custom-activity-card.component.html',
})
export class StudioCustomActivityCardComponent {
  readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('customLabelInput');

  @Input({ required: true }) isActive = false;
  @Input({ required: true }) customLabel = '';
  @Input({ required: true }) effectiveLabel = '';
  @Input({ required: true }) isCustomStudioLabel = false;
  @Input({ required: true }) count = 0;
  @Input({ required: true }) targetPerClass = 25;

  @Output() cardClick = new EventEmitter<void>();
  @Output() customLabelChange = new EventEmitter<string>();
  @Output() clearLabel = new EventEmitter<MouseEvent>();
  @Output() inputFocus = new EventEmitter<boolean>();

  focusInput(): void {
    this.inputEl()?.nativeElement.focus();
  }

  onSelectCard(): void {
    this.focusInput();
    this.cardClick.emit();
  }

  onModelChange(val: string): void {
    this.customLabelChange.emit(val);
  }

  onClear(event: MouseEvent): void {
    event.stopPropagation();
    this.clearLabel.emit(event);
    this.focusInput();
  }
}
