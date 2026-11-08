import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { AlertContactResponse } from '../../../models/api.models';

@Component({
  selector: 'app-fall-contacts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './fall-contacts.component.html',
})
export class FallContactsComponent {
  @Input({ required: true }) contacts: AlertContactResponse[] = [];
  @Input() loading = false;
  @Input() error = false;
  @Input() editingContact: AlertContactResponse | null = null;
  @Input() submitting = false;
  @Input() reordering = false;
  @Input() sendingTestContactId: number | string | null = null;
  @Input() deletingContactId: number | string | null = null;
  @Input() contactFormError: string | null = null;
  @Input() maxContactsReached = false;
  @Input({ required: true }) contactForm!: FormGroup;

  @Output() editContact = new EventEmitter<AlertContactResponse>();
  @Output() cancelEdit = new EventEmitter<void>();
  @Output() submitContact = new EventEmitter<void>();
  @Output() deleteContact = new EventEmitter<AlertContactResponse>();
  @Output() moveContactUp = new EventEmitter<number>();
  @Output() moveContactDown = new EventEmitter<number>();
  @Output() sendTestEmail = new EventEmitter<AlertContactResponse>();

  onStartEdit(contact: AlertContactResponse): void {
    this.editContact.emit(contact);
  }

  onCancelEdit(): void {
    this.cancelEdit.emit();
  }

  onSubmit(): void {
    this.submitContact.emit();
  }

  onDelete(contact: AlertContactResponse): void {
    this.deleteContact.emit(contact);
  }

  onMoveUp(index: number): void {
    this.moveContactUp.emit(index);
  }

  onMoveDown(index: number): void {
    this.moveContactDown.emit(index);
  }

  onSendTest(contact: AlertContactResponse): void {
    this.sendTestEmail.emit(contact);
  }
}
