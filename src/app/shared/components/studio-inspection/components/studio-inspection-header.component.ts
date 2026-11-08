import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { StudioSessionSummary } from '../../../../models/studio-history.model';
import {
  isCustomStudioLabel,
  isEdgeAiActivity,
} from '../../../../models/studio.model';

@Component({
  selector: 'app-studio-inspection-header',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  template: `
    <div class="shrink-0 flex flex-wrap items-center justify-between border-b border-gray-200 dark:border-gray-800 px-4 py-3 sm:px-6 sm:py-4 bg-gray-50/50 dark:bg-gray-800/50 gap-3">
      <div class="min-w-[220px] flex-1 max-w-full">
        <div class="flex flex-wrap items-center gap-2 sm:gap-2.5">
          @if (isStandalone()) {
            <a
              routerLink="/dashboard/studio/history"
              class="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition mr-1"
              data-testid="standalone-back-link"
            >
              <span>←</span>
              <span>{{ 'studio_history.back_to_history' | translate }}</span>
            </a>
            <span class="text-gray-300 dark:text-gray-600">/</span>
          }

          <h2 class="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
            {{ 'studio_history.drawer_title' | translate }}
          </h2>

          @if (!session().is_validated) {
            <button
              id="toggle-label-editor-btn"
              type="button"
              (click)="toggleLabelEditor.emit()"
              class="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold shrink-0 transition hover:opacity-85 active:scale-95 cursor-pointer"
              [ngClass]="labelBadgeClass()"
              [class.ring-2]="showLabelEditor()"
              [class.ring-primary-500]="showLabelEditor()"
              [title]="'studio_history.change_label' | translate"
              [attr.aria-expanded]="showLabelEditor()"
              data-testid="toggle-label-editor-btn"
            >
              <span>{{ labelIcon() }}</span>
              <span>{{ labelDisplayName() }}</span>
              <span class="text-[10px] opacity-75 ml-0.5">✏️</span>
            </button>
          } @else {
            <span
              class="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold shrink-0"
              [ngClass]="labelBadgeClass()"
            >
              <span>{{ labelIcon() }}</span>
              <span>{{ labelDisplayName() }}</span>
            </span>
          }

          @if (isEdgeAiActivity(session().label)) {
            <span
              class="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 shrink-0"
              data-testid="inspection-badge-edge-ai"
            >
              <span>⚡</span>
              <span>{{ 'studio_history.badge_edge_ai' | translate }}</span>
            </span>
          } @else {
            <span
              class="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 shrink-0"
              data-testid="inspection-badge-research"
            >
              <span>🧪</span>
              <span>{{ 'studio_history.badge_research' | translate }}</span>
            </span>
          }

          @if (isCustomStudioLabel(session().label)) {
            <span
              class="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 shrink-0"
              data-testid="inspection-badge-custom"
            >
              <span>🧪</span>
              <span>{{ 'studio_history.label_custom_tag' | translate }}</span>
            </span>
          }

          @if (session().is_validated) {
            <span
              class="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 shrink-0"
              data-testid="inspection-badge-validated"
            >
              <span>✅</span>
              <span>{{ 'studio_history.status_validated' | translate }}</span>
            </span>
          } @else {
            <span
              class="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 shrink-0"
              data-testid="inspection-badge-pending"
            >
              <span>⏳</span>
              <span>{{ 'studio_history.status_pending' | translate }}</span>
            </span>
          }

          @if (session().is_hitl) {
            <span
              class="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300 shrink-0"
              [title]="'studio_history.badge_hitl_title' | translate"
              data-testid="inspection-badge-hitl"
            >
              <span>🤖</span>
              <span>HITL</span>
            </span>
          }
        </div>
        <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-mono">
          <span class="break-all">
            <span class="text-gray-400 dark:text-gray-500">{{ 'studio_history.session_id_label' | translate }}</span>
            <span class="font-medium text-gray-700 dark:text-gray-300 select-all ml-1">{{ session().uuid }}</span>
          </span>
          <span class="text-gray-300 dark:text-gray-600 hidden sm:inline">·</span>
          <span class="text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {{ session().created_at | date:'dd/MM/yyyy HH:mm:ss' }}
          </span>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
        @if (!showDeleteConfirm()) {
          <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
            @if (!session().is_validated) {
              <button
                id="drawer-confirm-btn"
                type="button"
                (click)="confirmSession.emit()"
                [disabled]="isValidatingSession()"
                class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700 transition active:scale-95 disabled:opacity-50"
                data-testid="confirm-session-btn"
              >
                @if (isValidatingSession()) {
                  <span class="animate-spin">⏳</span>
                } @else {
                  <span>✅</span>
                }
                <span>{{ 'studio_history.confirm_session_btn' | translate }}</span>
              </button>
            } @else if (!showUnvalidateConfirm()) {
              <button
                type="button"
                (click)="showUnvalidateConfirmChange.emit(true)"
                [disabled]="isUpdatingValidation()"
                data-testid="unvalidate-session-btn"
                class="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 shadow-2xs hover:bg-amber-50 disabled:opacity-50 dark:border-amber-700 dark:bg-gray-900 dark:text-amber-200"
              >
                {{ 'studio_history.unvalidate_session_btn' | translate }}
              </button>
            } @else {
              <div class="flex flex-wrap items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/80 px-2.5 py-1 dark:border-amber-800 dark:bg-amber-950/40" data-testid="unvalidate-confirmation">
                <span class="text-[11px] text-amber-800 dark:text-amber-300 hidden md:inline">
                  {{ 'studio_history.unvalidate_confirm_warning' | translate }}
                </span>
                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    (click)="reopenSession.emit()"
                    [disabled]="isUpdatingValidation()"
                    data-testid="confirm-unvalidate-session-btn"
                    class="rounded-md bg-amber-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    @if (isUpdatingValidation()) { ⏳ }
                    {{ 'studio_history.unvalidate_session_btn' | translate }}
                  </button>
                  <button
                    type="button"
                    (click)="showUnvalidateConfirmChange.emit(false)"
                    [disabled]="isUpdatingValidation()"
                    class="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    {{ 'common.cancel' | translate }}
                  </button>
                </div>
              </div>
            }

            <button
              id="delete-session-btn"
              type="button"
              (click)="confirmDelete.emit()"
              data-testid="delete-session-btn"
              class="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 shadow-2xs hover:bg-red-50 transition active:scale-95 dark:border-red-900/50 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-950/40"
              [title]="'studio_history.delete_session' | translate"
            >
              <span>🗑️</span>
              <span class="hidden sm:inline">{{ 'studio_history.delete_session' | translate }}</span>
            </button>
          </div>
        } @else {
          <div class="flex flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50/90 px-2.5 py-1 dark:border-red-900/50 dark:bg-red-950/40">
            <span class="text-[11px] font-medium text-red-800 dark:text-red-300">
              ⚠️ {{ 'studio_history.delete_confirm' | translate }}
            </span>
            <div class="flex items-center gap-1.5">
              <button
                id="confirm-delete-btn"
                type="button"
                (click)="deleteSession.emit()"
                data-testid="confirm-delete-btn"
                class="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-red-700 transition active:scale-95 disabled:opacity-50"
              >
                {{ 'studio_history.delete_session' | translate }}
              </button>
              <button
                id="cancel-delete-btn"
                type="button"
                (click)="cancelDelete.emit()"
                data-testid="cancel-delete-btn"
                class="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition active:scale-95 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {{ 'common.cancel' | translate }}
              </button>
            </div>
          </div>
        }

        <span class="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-0.5 hidden sm:inline-block"></span>

        <button
          type="button"
          (click)="copyShareLink.emit()"
          class="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-2xs hover:bg-gray-50 transition active:scale-95 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          [title]="'studio_history.copy_link' | translate"
          [attr.aria-label]="'studio_history.copy_link' | translate"
          data-testid="copy-link-btn"
        >
          <span>🔗</span>
          @if (isStandalone()) {
            <span class="hidden sm:inline">
              {{ linkCopied() ? ('studio_history.link_copied' | translate) : ('studio_history.copy_link' | translate) }}
            </span>
          }
        </button>

        <button
          type="button"
          (click)="exportJson.emit()"
          [disabled]="isLoadingReadings()"
          class="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-2xs hover:bg-gray-50 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          [title]="'studio_history.export_json' | translate"
          [attr.aria-label]="'studio_history.export_json' | translate"
          data-testid="export-json-btn"
        >
          <span>📥</span>
          @if (isStandalone()) {
            <span class="hidden sm:inline">{{ 'studio_history.export_json' | translate }}</span>
          }
        </button>

        @if (!isStandalone()) {
          <a
            [routerLink]="['/dashboard/studio/history', session().uuid]"
            class="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-gray-700 shadow-2xs hover:bg-gray-50 transition active:scale-95 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            [title]="'studio_history.open_full_page' | translate"
            [attr.aria-label]="'studio_history.open_full_page' | translate"
            data-testid="open-full-page-btn"
          >
            <span>↗️</span>
          </a>
        }

        @if (showNavigation() && !isStandalone()) {
          <div class="flex items-center rounded-lg border border-gray-200 bg-white p-0.5 shadow-xs dark:border-gray-700 dark:bg-gray-800">
            <button
              id="prev-session-btn"
              type="button"
              (click)="previous.emit()"
              [disabled]="!hasPrevious()"
              class="inline-flex items-center gap-1 rounded-md px-2 sm:px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed dark:text-gray-300 dark:hover:bg-gray-700"
              [title]="'studio_history.prev' | translate"
              [attr.aria-label]="'studio_history.prev' | translate"
              data-testid="prev-session-btn"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <span class="h-3.5 w-px bg-gray-200 dark:bg-gray-700 mx-0.5"></span>

            <button
              id="next-session-btn"
              type="button"
              (click)="next.emit()"
              [disabled]="!hasNext()"
              class="inline-flex items-center gap-1 rounded-md px-2 sm:px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed dark:text-gray-300 dark:hover:bg-gray-700"
              [title]="'studio_history.next' | translate"
              [attr.aria-label]="'studio_history.next' | translate"
              data-testid="next-session-btn"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        }

        <button
          id="close-inspection-btn"
          type="button"
          (click)="close.emit()"
          class="rounded-lg p-1.5 sm:p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition"
          [title]="'common.close' | translate"
          [attr.aria-label]="'common.close' | translate"
          data-testid="close-inspection-btn"
        >
          ✕
        </button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudioInspectionHeaderComponent {
  readonly isCustomStudioLabel = isCustomStudioLabel;
  readonly isEdgeAiActivity = isEdgeAiActivity;

  readonly session = input.required<StudioSessionSummary>();
  readonly isStandalone = input<boolean>(false);
  readonly showNavigation = input<boolean>(true);
  readonly hasPrevious = input<boolean>(false);
  readonly hasNext = input<boolean>(false);
  readonly showLabelEditor = input<boolean>(false);
  readonly showDeleteConfirm = input<boolean>(false);
  readonly showUnvalidateConfirm = input<boolean>(false);
  readonly isValidatingSession = input<boolean>(false);
  readonly isUpdatingValidation = input<boolean>(false);
  readonly isLoadingReadings = input<boolean>(false);
  readonly linkCopied = input<boolean>(false);

  readonly labelBadgeClass = input<string>('');
  readonly labelIcon = input<string>('');
  readonly labelDisplayName = input<string>('');

  readonly toggleLabelEditor = output<void>();
  readonly confirmSession = output<void>();
  readonly reopenSession = output<void>();
  readonly confirmDelete = output<void>();
  readonly deleteSession = output<void>();
  readonly cancelDelete = output<void>();
  readonly copyShareLink = output<void>();
  readonly exportJson = output<void>();
  readonly previous = output<void>();
  readonly next = output<void>();
  readonly close = output<void>();
  readonly showUnvalidateConfirmChange = output<boolean>();
}
