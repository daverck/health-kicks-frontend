import {
  Component,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
  computed,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StudioHistoryService } from '../../../core/services/studio-history.service';
import { StudioService } from '../../../core/services/studio.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslationService } from '../../../core/services/translation.service';
import { StudioSessionSummary } from '../../../models/studio-history.model';
import { ImuReading } from '../../../models/telemetry.models';
import { ImuChartComponent } from '../imu-chart/imu-chart.component';
import { Shoe3dViewerComponent } from '../shoe-3d-viewer/shoe-3d-viewer.component';
import { IsbGuideComponent } from '../isb-guide/isb-guide.component';
import { TranslatePipe } from '../../pipes/translate.pipe';
import {
  PREDEFINED_LABELS,
  PredefinedLabel,
  isStandardStudioLabel,
  isCustomStudioLabel,
  CUSTOM_LABEL_ICON,
  CUSTOM_LABEL_BADGE_CLASS,
} from '../../../models/studio.model';
import { exportSessionToJson } from '../../../core/utils/export.utils';

@Component({
  selector: 'app-studio-inspection',
  standalone: true,
  host: {
    '[class.flex]': '!isStandalone()',
    '[class.flex-col]': '!isStandalone()',
    '[class.flex-1]': '!isStandalone()',
    '[class.min-h-0]': '!isStandalone()',
    '[class.h-full]': '!isStandalone()',
    '[class.overflow-hidden]': '!isStandalone()',
    '[class.block]': 'isStandalone()',
  },
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslatePipe,
    ImuChartComponent,
    Shoe3dViewerComponent,
    IsbGuideComponent,
  ],
  templateUrl: './studio-inspection.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudioInspectionComponent implements OnInit, OnChanges {
  private readonly studioHistoryService = inject(StudioHistoryService);
  private readonly studioService = inject(StudioService);
  private readonly toast = inject(ToastService);
  readonly translation = inject(TranslationService);

  readonly predefinedLabels: PredefinedLabel[] = PREDEFINED_LABELS;
  readonly isStandardStudioLabel = isStandardStudioLabel;
  readonly isCustomStudioLabel = isCustomStudioLabel;
  readonly customLabelIcon = CUSTOM_LABEL_ICON;

  // Inputs
  readonly session = input<StudioSessionSummary | null>(null);
  readonly isStandalone = input<boolean>(false);
  readonly hasPrevious = input<boolean>(false);
  readonly hasNext = input<boolean>(false);
  readonly showNavigation = input<boolean>(true);

  // Outputs
  readonly previous = output<void>();
  readonly next = output<void>();
  readonly close = output<void>();
  readonly sessionUpdated = output<StudioSessionSummary>();
  readonly sessionConfirmed = output<StudioSessionSummary>();
  readonly sessionDeleted = output<string>();

  // State
  readonly activeReadings = signal<ImuReading[]>([]);
  readonly isLoadingReadings = signal<boolean>(false);
  readonly isValidatingSession = signal<boolean>(false);
  readonly isTrimmingSession = signal<boolean>(false);
  readonly isUpdatingValidation = signal<boolean>(false);
  readonly readingsError = signal<string | null>(null);
  readonly replayPlaybackTime = signal<number>(0);
  readonly show3dViewer = signal<boolean>(false);
  readonly trimDurationSec = signal<number>(2);
  readonly showTrimConfirm = signal<boolean>(false);
  readonly showUnvalidateConfirm = signal<boolean>(false);

  readonly trimMaxDurationSec = computed(() => {
    const duration = this.session()?.duration_sec ?? 0;
    return Math.floor(Math.min(duration, 30) * 10) / 10;
  });

  readonly trimPreviewReadings = computed(() => {
    const readings = this.activeReadings();
    if (readings.length === 0) return [];
    const cutoffTimestamp =
      readings[0].timestamp_epoch_us + Math.round(this.trimDurationSec() * 1_000_000);
    return readings.filter((reading) => reading.timestamp_epoch_us <= cutoffTimestamp);
  });

  toggle3dViewer(): void {
    this.show3dViewer.update((v) => !v);
  }

  // Curation State
  readonly labelEditMode = signal<'predefined' | 'custom'>('predefined');
  readonly editLabelValue = signal<string>('walk');
  readonly customLabelValue = signal<string>('');
  readonly isUpdatingLabel = signal<boolean>(false);
  readonly isDeletingSession = signal<boolean>(false);
  readonly showDeleteConfirm = signal<boolean>(false);
  readonly linkCopied = signal<boolean>(false);

  readonly effectiveEditLabel = computed<string>(() => {
    if (this.labelEditMode() === 'custom') {
      return this.customLabelValue().trim().toLowerCase();
    }
    return this.editLabelValue();
  });

  readonly canSaveLabel = computed<boolean>(() => {
    const currentSession = this.session();
    if (!currentSession || currentSession.is_validated) return false;
    const target = this.effectiveEditLabel();
    return Boolean(target) && target !== currentSession.label;
  });

  private currentSessionId: string | null = null;

  onReplayTimeSelected(timeSec: number): void {
    this.replayPlaybackTime.set(timeSec);
  }

  onTrimDurationChanged(durationSec: number): void {
    const maxDuration = this.trimMaxDurationSec();
    const nextDuration = Math.min(maxDuration, Math.max(0.6, Number(durationSec)));
    const roundedDuration = Math.round(nextDuration * 10) / 10;
    this.trimDurationSec.set(roundedDuration);
    this.replayPlaybackTime.set(roundedDuration);
  }

  ngOnInit(): void {
    const current = this.session();
    if (current && this.currentSessionId !== current.id) {
      this.initSessionState(current);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['session']) {
      const current = this.session();
      if (current) {
        if (this.currentSessionId === current.id) {
          this.syncLabelState(current);
        } else {
          this.initSessionState(current);
        }
      } else {
        this.currentSessionId = null;
        this.activeReadings.set([]);
      }
    }
  }

  private syncLabelState(session: StudioSessionSummary): void {
    const isPredefined = this.predefinedLabels.some((l) => l.id === session.label);
    if (isPredefined) {
      this.labelEditMode.set('predefined');
      this.editLabelValue.set(session.label);
      this.customLabelValue.set('');
    } else {
      this.labelEditMode.set('custom');
      this.customLabelValue.set(session.label);
      this.editLabelValue.set('walk');
    }
  }

  private initSessionState(session: StudioSessionSummary): void {
    this.currentSessionId = session.id;
    this.syncLabelState(session);
    this.activeReadings.set([]);
    this.replayPlaybackTime.set(0);
    this.show3dViewer.set(false);
    this.showDeleteConfirm.set(false);
    this.showTrimConfirm.set(false);
    this.showUnvalidateConfirm.set(false);
    this.trimDurationSec.set(Math.max(0.6, Math.min(2, this.trimMaxDurationFor(session.duration_sec))));
    this.replayPlaybackTime.set(this.trimDurationSec());
    this.linkCopied.set(false);
    this.loadReadings(session.id);
  }

  private trimMaxDurationFor(durationSec: number): number {
    return Math.floor(Math.min(durationSec, 30) * 10) / 10;
  }

  loadReadings(sessionId: string): void {
    this.isLoadingReadings.set(true);
    this.readingsError.set(null);

    this.studioHistoryService.getSessionReadings(sessionId).subscribe({
      next: (res) => {
        this.activeReadings.set(res.readings ?? []);
        this.isLoadingReadings.set(false);
      },
      error: (err) => {
        this.isLoadingReadings.set(false);
        this.readingsError.set(
          err?.error?.detail ??
            'Impossible de récupérer les trames IMU de cette session.'
        );
      },
    });
  }

  confirmSession(): void {
    const current = this.session();
    if (!current) return;

    this.isValidatingSession.set(true);
    this.studioHistoryService.confirmSession(current.id).subscribe({
      next: (updated) => {
        this.isValidatingSession.set(false);
        this.toast.success(this.translation.translate('studio_history.session_confirmed_success'));
        this.sessionConfirmed.emit(updated);
      },
      error: (err) => {
        this.isValidatingSession.set(false);
        this.toast.error(
          err?.error?.detail ?? 'Erreur lors de la validation de la session.'
        );
      },
    });
  }

  trimSession(): void {
    const current = this.session();
    const newDurationSec = this.trimDurationSec();
    if (
      !current ||
      current.is_validated ||
      newDurationSec <= 0.5 ||
      newDurationSec >= current.duration_sec ||
      this.isTrimmingSession()
    ) {
      return;
    }

    this.isTrimmingSession.set(true);
    this.studioService.trimSession(current.id, newDurationSec).subscribe({
      next: (updated) => {
        this.isTrimmingSession.set(false);
        this.showTrimConfirm.set(false);
        this.activeReadings.set(this.trimPreviewReadings());
        this.trimDurationSec.set(updated.duration_sec);
        this.replayPlaybackTime.set(updated.duration_sec);
        this.toast.success(
          this.translation.translate('studio_history.trim_success', {
            duration: updated.duration_sec.toFixed(1),
          })
        );
        this.sessionUpdated.emit(updated);
      },
      error: (err) => {
        this.isTrimmingSession.set(false);
        this.toast.error(
          err?.error?.detail ?? this.translation.translate('studio_history.trim_error')
        );
      },
    });
  }

  reopenSession(): void {
    const current = this.session();
    if (!current?.is_validated || this.isUpdatingValidation()) return;

    this.isUpdatingValidation.set(true);
    this.studioHistoryService.updateSessionValidation(current.id, false).subscribe({
      next: (updated) => {
        this.isUpdatingValidation.set(false);
        this.showUnvalidateConfirm.set(false);
        this.toast.success(
          this.translation.translate('studio_history.session_unvalidated_success')
        );
        this.sessionUpdated.emit(updated);
      },
      error: (err) => {
        this.isUpdatingValidation.set(false);
        this.toast.error(
          err?.error?.detail ??
            this.translation.translate('studio_history.session_unvalidated_error')
        );
      },
    });
  }

  updateLabel(): void {
    const current = this.session();
    const newLabel = this.effectiveEditLabel();
    if (!current || current.is_validated || !newLabel || newLabel === current.label) {
      return;
    }

    this.isUpdatingLabel.set(true);
    this.studioHistoryService.updateSessionLabel(current.id, newLabel).subscribe({
      next: (updated) => {
        this.isUpdatingLabel.set(false);
        this.toast.success(
          this.translation.translate('studio_history.label_updated')
        );
        this.sessionUpdated.emit(updated);
      },
      error: (err) => {
        this.isUpdatingLabel.set(false);
        this.toast.error(
          err?.error?.detail ?? 'Erreur lors de la mise à jour du label.'
        );
      },
    });
  }

  confirmDelete(): void {
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
  }

  deleteSession(): void {
    const current = this.session();
    if (!current) return;

    // Immediately dismiss confirmation banner and notify parent component
    this.showDeleteConfirm.set(false);
    this.sessionDeleted.emit(current.id);

    this.isDeletingSession.set(true);
    this.studioHistoryService.deleteSession(current.id).subscribe({
      next: () => {
        this.isDeletingSession.set(false);
        this.toast.info(
          this.translation.translate('studio_history.session_deleted')
        );
      },
      error: (err) => {
        this.isDeletingSession.set(false);
        this.toast.error(
          err?.error?.detail ?? 'Erreur lors de la suppression de la session.'
        );
      },
    });
  }

  copyShareLink(): void {
    const current = this.session();
    if (!current) return;

    const url = `${window.location.origin}/dashboard/studio/history/${current.id}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        this.linkCopied.set(true);
        this.toast.success(this.translation.translate('studio_history.link_copied'));
        setTimeout(() => this.linkCopied.set(false), 3000);
      });
    }
  }

  exportJson(): void {
    const s = this.session();
    if (!s) return;
    const readings = this.activeReadings();
    if (readings.length === 0 && !this.isLoadingReadings()) {
      this.toast.info(this.translation.translate('studio_history.export_no_data'));
      return;
    }
    exportSessionToJson(s, readings);
    this.toast.success(this.translation.translate('studio_history.export_success'));
  }

  getLabelBadgeClass(label: string): string {
    if (!isStandardStudioLabel(label)) {
      return CUSTOM_LABEL_BADGE_CLASS;
    }
    if (label === 'idle') {
      return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200';
    }
    if (label.startsWith('fall_')) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    if (label === 'walk' || label === 'run') {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (label === 'stairs' || label === 'stumble_recover') {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    return 'bg-indigo-100 text-indigo-800 border-indigo-200';
  }

  getLabelDisplayName(label: string): string {
    if (!label) return '';
    if (isStandardStudioLabel(label)) {
      const key = `studio.labels.${label}`;
      const translated = this.translation.translate(key);
      return translated !== key ? translated : label;
    }
    return label;
  }

  getLabelIcon(labelId: string): string {
    const found = this.predefinedLabels.find((l) => l.id === labelId);
    return found ? found.icon : CUSTOM_LABEL_ICON;
  }
}
