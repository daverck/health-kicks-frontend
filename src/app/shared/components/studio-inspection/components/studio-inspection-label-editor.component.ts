import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import {
  PredefinedLabel,
  isCustomStudioLabel,
} from '../../../../models/studio.model';

@Component({
  selector: 'app-studio-inspection-label-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div
      class="shrink-0 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/70 px-4 py-2.5 sm:px-6 space-y-2 transition-all"
      [class.hidden]="!showLabelEditor() && !isCustomStudioLabel(currentLabel())"
      data-testid="header-label-editor-bar"
    >
      <div
        class="flex flex-wrap items-center gap-2 sm:gap-3"
        [class.hidden]="!showLabelEditor()"
      >
        <span class="text-xs font-semibold text-gray-700 dark:text-gray-300 shrink-0">
          {{ 'studio_history.change_label' | translate }}
        </span>

        <!-- Mode Toggle Pill: Predefined vs Custom -->
        <div class="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 shadow-2xs text-[11px] dark:border-gray-700 dark:bg-gray-900 shrink-0">
          <button
            id="label-mode-predefined-btn"
            type="button"
            (click)="labelEditModeChange.emit('predefined')"
            data-testid="label-mode-predefined"
            class="rounded-md px-2 py-0.5 font-medium transition"
            [ngClass]="labelEditMode() === 'predefined'
              ? 'bg-primary-50 font-semibold text-primary-700 shadow-2xs dark:bg-primary-950/70 dark:text-primary-300'
              : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'"
          >
            📋 {{ 'studio_history.label_mode_predefined' | translate }}
          </button>
          <button
            id="label-mode-custom-btn"
            type="button"
            (click)="labelEditModeChange.emit('custom')"
            data-testid="label-mode-custom"
            class="rounded-md px-2 py-0.5 font-medium transition"
            [ngClass]="labelEditMode() === 'custom'
              ? 'bg-primary-50 font-semibold text-primary-700 shadow-2xs dark:bg-primary-950/70 dark:text-primary-300'
              : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'"
          >
            ✏️ {{ 'studio_history.label_mode_custom' | translate }}
          </button>
        </div>

        <div class="flex flex-1 flex-wrap items-center gap-2 min-w-[220px]">
          @if (labelEditMode() === 'predefined') {
            <!-- Predefined Select -->
            <select
              id="edit-label-select"
              [ngModel]="editLabelValue()"
              (ngModelChange)="editLabelValueChange.emit($event)"
              data-testid="edit-label-select"
              class="flex-1 min-w-[180px] rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 shadow-2xs focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              @for (l of predefinedLabels(); track l.id) {
                <option [value]="l.id">{{ l.icon }} {{ 'studio.labels.' + l.id | translate }}</option>
              }
            </select>
          } @else {
            <!-- Custom Label Input -->
            <div class="relative flex-1 min-w-[180px]">
              <input
                id="edit-custom-label-input"
                type="text"
                maxlength="64"
                [placeholder]="'studio_history.custom_label_placeholder' | translate"
                [ngModel]="customLabelValue()"
                (ngModelChange)="customLabelValueChange.emit($event)"
                (keydown.enter)="canSaveLabel() && !isUpdatingLabel() && saveLabel.emit()"
                data-testid="edit-custom-label-input"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 pr-8 text-xs font-medium text-gray-800 placeholder:text-gray-400 shadow-2xs focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:placeholder:text-gray-500"
              />
              @if (customLabelValue()) {
                <button
                  type="button"
                  (click)="customLabelValueChange.emit('')"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs"
                  aria-label="Effacer le label"
                >
                  ✕
                </button>
              }
            </div>
          }

          <button
            id="update-label-btn"
            type="button"
            (click)="saveLabel.emit()"
            [disabled]="isUpdatingLabel() || !canSaveLabel()"
            data-testid="update-label-btn"
            class="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-primary-700 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            @if (isUpdatingLabel()) {
              <span class="animate-spin">⏳</span>
            } @else {
              <span>💾</span>
            }
            {{ 'studio_history.save_label' | translate }}
          </button>

          <button
            type="button"
            (click)="cancelEdit.emit()"
            class="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 shrink-0"
            data-testid="close-label-editor-btn"
          >
            {{ 'common.cancel' | translate }}
          </button>
        </div>
      </div>

      @if (showLabelEditor() && labelEditMode() === 'custom') {
        <p class="text-[11px] text-gray-500 dark:text-gray-400">
          {{ 'studio_history.custom_label_hint' | translate }}
        </p>
      }

      @if (isCustomStudioLabel(currentLabel())) {
        <div class="rounded-lg border border-purple-200 bg-purple-50/70 p-2 text-xs text-purple-800 flex items-start gap-2 dark:bg-purple-950/30 dark:border-purple-800 dark:text-purple-300" data-testid="inspection-custom-note">
          <span class="text-sm">🧪</span>
          <div>
            <span class="font-semibold">{{ 'studio_history.label_custom_tag' | translate }} :</span>
            <span> {{ 'studio_history.custom_label_experimental_note' | translate }}</span>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudioInspectionLabelEditorComponent {
  readonly isCustomStudioLabel = isCustomStudioLabel;

  readonly showLabelEditor = input<boolean>(false);
  readonly currentLabel = input.required<string>();
  readonly labelEditMode = input<'predefined' | 'custom'>('predefined');
  readonly editLabelValue = input<string>('');
  readonly customLabelValue = input<string>('');
  readonly predefinedLabels = input.required<PredefinedLabel[]>();
  readonly isUpdatingLabel = input<boolean>(false);
  readonly canSaveLabel = input<boolean>(false);

  readonly labelEditModeChange = output<'predefined' | 'custom'>();
  readonly editLabelValueChange = output<string>();
  readonly customLabelValueChange = output<string>();
  readonly saveLabel = output<void>();
  readonly cancelEdit = output<void>();
}
