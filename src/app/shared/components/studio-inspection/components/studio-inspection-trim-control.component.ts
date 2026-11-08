import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-studio-inspection-trim-control',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <section
      class="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-3 dark:border-amber-900/60 dark:bg-amber-950/20"
      data-testid="trim-session-control"
    >
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 class="text-xs font-bold text-amber-900 dark:text-amber-200">
            {{ 'studio_history.trim_session_title' | translate }}
          </h4>
          <p class="mt-1 text-[11px] text-amber-800 dark:text-amber-300">
            {{ 'studio_history.trim_preview_help' | translate }}
          </p>
        </div>
        <span class="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-900 dark:bg-gray-900 dark:text-amber-200">
          {{ 'studio_history.trim_frames_kept' | translate }}:
          {{ keptFramesCount() }} / {{ totalFramesCount() }}
        </span>
      </div>
      @if (!showTrimConfirm()) {
        <button
          type="button"
          (click)="showTrimConfirmChange.emit(true)"
          [disabled]="isLoadingReadings() || totalFramesCount() === 0 || isTrimmingSession()"
          data-testid="trim-session-btn"
          class="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-amber-700 transition disabled:opacity-50"
        >
          <span>✂️</span> {{ 'studio_history.trim_session_btn' | translate }}
        </button>
      } @else {
        <div class="flex flex-wrap gap-2" data-testid="trim-confirmation">
          <button
            type="button"
            (click)="trimSession.emit()"
            [disabled]="isTrimmingSession() || !hasTrimChanges()"
            data-testid="confirm-trim-session-btn"
            class="rounded-md bg-amber-700 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
          >
            @if (isTrimmingSession()) { ⏳ } @else { ✂️ }
            {{ 'studio_history.trim_confirm_title' | translate }}
          </button>
          <button
            type="button"
            (click)="showTrimConfirmChange.emit(false)"
            [disabled]="isTrimmingSession()"
            class="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            {{ 'common.cancel' | translate }}
          </button>
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudioInspectionTrimControlComponent {
  readonly showTrimConfirm = input<boolean>(false);
  readonly keptFramesCount = input<number>(0);
  readonly totalFramesCount = input<number>(0);
  readonly isLoadingReadings = input<boolean>(false);
  readonly isTrimmingSession = input<boolean>(false);
  readonly hasTrimChanges = input<boolean>(false);

  readonly showTrimConfirmChange = output<boolean>();
  readonly trimSession = output<void>();
}
