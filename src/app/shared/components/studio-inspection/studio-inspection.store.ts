import { Injectable, computed, inject, signal } from '@angular/core';
import { StudioHistoryService } from '../../../core/services/studio-history.service';
import { StudioService } from '../../../core/services/studio.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslationService } from '../../../core/services/translation.service';
import { StudioSessionSummary } from '../../../models/studio-history.model';
import { ImuReading } from '../../../models/telemetry.models';
import { PREDEFINED_LABELS } from '../../../models/studio.model';
import { exportSessionToJson } from '../../../core/utils/export.utils';

export const MIN_TRIM_INTERVAL_SEC = 2;

@Injectable()
export class StudioInspectionStore {
  readonly minimumTrimDurationSec = MIN_TRIM_INTERVAL_SEC;

  private readonly studioHistoryService = inject(StudioHistoryService);
  private readonly studioService = inject(StudioService);
  private readonly toast = inject(ToastService);
  private readonly translation = inject(TranslationService);

  readonly predefinedLabels = PREDEFINED_LABELS;

  // Session state
  readonly session = signal<StudioSessionSummary | null>(null);
  readonly currentSessionId = signal<string | null>(null);

  // Telemetry & Viewer state
  readonly activeReadings = signal<ImuReading[]>([]);
  readonly isLoadingReadings = signal<boolean>(false);
  readonly readingsError = signal<string | null>(null);
  readonly replayPlaybackTime = signal<number>(0);
  readonly show3dViewer = signal<boolean>(false);

  // Trimming state
  readonly trimStartOffsetSec = signal<number>(0);
  readonly trimEndOffsetSec = signal<number>(2);
  readonly showTrimConfirm = signal<boolean>(false);
  readonly isTrimmingSession = signal<boolean>(false);

  // Validation state
  readonly isValidatingSession = signal<boolean>(false);
  readonly isUpdatingValidation = signal<boolean>(false);
  readonly showUnvalidateConfirm = signal<boolean>(false);

  // Curation & Label Editor state
  readonly showLabelEditor = signal<boolean>(false);
  readonly labelEditMode = signal<'predefined' | 'custom'>('predefined');
  readonly editLabelValue = signal<string>('walk');
  readonly customLabelValue = signal<string>('');
  readonly isUpdatingLabel = signal<boolean>(false);

  // Deletion & Share state
  readonly showDeleteConfirm = signal<boolean>(false);
  readonly isDeletingSession = signal<boolean>(false);
  readonly linkCopied = signal<boolean>(false);

  // Computeds
  readonly trimMaxDurationSec = computed(() => {
    const duration = this.session()?.duration_sec ?? 0;
    return Math.min(duration, 30);
  });

  readonly trimDurationSec = computed(
    () => this.trimEndOffsetSec() - this.trimStartOffsetSec()
  );

  readonly hasTrimChanges = computed(() => {
    const duration = this.session()?.duration_sec ?? 0;
    return this.trimStartOffsetSec() > 0 || this.trimEndOffsetSec() < duration;
  });

  readonly trimPreviewReadings = computed(() => {
    const readings = this.activeReadings();
    if (readings.length === 0) return [];
    const startTimestamp =
      readings[0].timestamp_epoch_us + Math.round(this.trimStartOffsetSec() * 1_000_000);
    const endTimestamp =
      readings[0].timestamp_epoch_us + Math.round(this.trimEndOffsetSec() * 1_000_000);
    return readings.filter(
      (reading) =>
        reading.timestamp_epoch_us >= startTimestamp &&
        reading.timestamp_epoch_us <= endTimestamp
    );
  });

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

  setSession(newSession: StudioSessionSummary | null): void {
    const prevSession = this.session();
    this.session.set(newSession);

    if (!newSession) {
      this.currentSessionId.set(null);
      this.activeReadings.set([]);
      return;
    }

    if (prevSession && prevSession.uuid === newSession.uuid) {
      this.syncLabelState(newSession);
      if (newSession.is_validated) {
        this.showLabelEditor.set(false);
      }
    } else {
      this.initSessionState(newSession);
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

  initSessionState(session: StudioSessionSummary): void {
    this.currentSessionId.set(session.uuid);
    this.syncLabelState(session);
    this.showLabelEditor.set(false);
    this.activeReadings.set([]);
    this.replayPlaybackTime.set(0);
    this.show3dViewer.set(false);
    this.showDeleteConfirm.set(false);
    this.showTrimConfirm.set(false);
    this.showUnvalidateConfirm.set(false);
    this.trimStartOffsetSec.set(0);
    const maxTrim = Math.min(session.duration_sec, 30);
    this.trimEndOffsetSec.set(maxTrim);
    this.replayPlaybackTime.set(maxTrim);
    this.linkCopied.set(false);
    this.loadReadings(session.uuid);
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

  toggle3dViewer(): void {
    this.show3dViewer.update((v) => !v);
  }

  toggleLabelEditor(): void {
    if (this.session()?.is_validated) return;
    this.showLabelEditor.update((v) => !v);
  }

  onReplayTimeSelected(timeSec: number): void {
    this.replayPlaybackTime.set(timeSec);
  }

  onTrimHandleChanged(event: { handle: 'start' | 'end'; timeSec: number }): void {
    if (event.handle === 'start') {
      this.onTrimStartChanged(event.timeSec);
    } else {
      this.onTrimEndChanged(event.timeSec);
    }
  }

  onTrimStartChanged(offsetSec: number): void {
    const latestStart = this.trimEndOffsetSec() - MIN_TRIM_INTERVAL_SEC;
    const nextStart = Math.min(
      Math.floor(latestStart * 10) / 10,
      Math.max(0, Number(offsetSec))
    );
    const roundedStart = Math.round(nextStart * 10) / 10;
    this.trimStartOffsetSec.set(roundedStart);
  }

  onTrimEndChanged(offsetSec: number): void {
    const earliestEnd = this.trimStartOffsetSec() + MIN_TRIM_INTERVAL_SEC;
    const minimumEnd = Math.ceil(earliestEnd * 10) / 10;
    const nextEnd = Math.min(
      this.trimMaxDurationSec(),
      Math.max(minimumEnd, Number(offsetSec))
    );
    const roundedEnd = Math.min(
      this.trimMaxDurationSec(),
      Math.round(nextEnd * 10) / 10
    );
    this.trimEndOffsetSec.set(roundedEnd);
  }

  confirmSession(onSuccess?: (updated: StudioSessionSummary) => void): void {
    const current = this.session();
    if (!current) return;

    this.isValidatingSession.set(true);
    this.studioHistoryService.confirmSession(current.uuid).subscribe({
      next: (updated) => {
        this.isValidatingSession.set(false);
        this.toast.success(this.translation.translate('studio_history.session_confirmed_success'));
        onSuccess?.(updated);
      },
      error: (err) => {
        this.isValidatingSession.set(false);
        this.toast.error(
          err?.error?.detail ?? 'Erreur lors de la validation de la session.'
        );
      },
    });
  }

  trimSession(onSuccess?: (updated: StudioSessionSummary) => void): void {
    const current = this.session();
    const startOffsetSec = this.trimStartOffsetSec();
    const endOffsetSec = this.trimEndOffsetSec();
    const newDurationSec = endOffsetSec - startOffsetSec;
    if (
      !current ||
      current.is_validated ||
      newDurationSec < MIN_TRIM_INTERVAL_SEC ||
      !this.hasTrimChanges() ||
      this.isTrimmingSession()
    ) {
      return;
    }

    this.isTrimmingSession.set(true);
    this.studioService.trimSession(current.uuid, startOffsetSec, endOffsetSec).subscribe({
      next: (updated) => {
        this.isTrimmingSession.set(false);
        this.showTrimConfirm.set(false);
        this.activeReadings.set(this.trimPreviewReadings());
        this.trimStartOffsetSec.set(0);
        this.trimEndOffsetSec.set(updated.duration_sec);
        this.replayPlaybackTime.set(updated.duration_sec);
        this.toast.success(
          this.translation.translate('studio_history.trim_success', {
            start: startOffsetSec.toFixed(1),
            end: endOffsetSec.toFixed(1),
            duration: updated.duration_sec.toFixed(1),
          })
        );
        onSuccess?.(updated);
      },
      error: (err) => {
        this.isTrimmingSession.set(false);
        this.toast.error(
          err?.error?.detail ?? this.translation.translate('studio_history.trim_error')
        );
      },
    });
  }

  reopenSession(onSuccess?: (updated: StudioSessionSummary) => void): void {
    const current = this.session();
    if (!current?.is_validated || this.isUpdatingValidation()) return;

    this.isUpdatingValidation.set(true);
    this.studioHistoryService.updateSessionValidation(current.uuid, false).subscribe({
      next: (updated) => {
        this.isUpdatingValidation.set(false);
        this.showUnvalidateConfirm.set(false);
        this.toast.success(
          this.translation.translate('studio_history.session_unvalidated_success')
        );
        onSuccess?.(updated);
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

  updateLabel(onSuccess?: (updated: StudioSessionSummary) => void): void {
    const current = this.session();
    const newLabel = this.effectiveEditLabel();
    if (!current || current.is_validated || !newLabel || newLabel === current.label) {
      return;
    }

    this.isUpdatingLabel.set(true);
    this.studioHistoryService.updateSessionLabel(current.uuid, newLabel).subscribe({
      next: (updated) => {
        this.isUpdatingLabel.set(false);
        this.showLabelEditor.set(false);
        this.toast.success(
          this.translation.translate('studio_history.label_updated')
        );
        onSuccess?.(updated);
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

  deleteSession(onDeleteInitiated?: (sessionId: string) => void): void {
    const current = this.session();
    if (!current) return;

    this.showDeleteConfirm.set(false);
    onDeleteInitiated?.(current.uuid);

    this.isDeletingSession.set(true);
    this.studioHistoryService.deleteSession(current.uuid).subscribe({
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

    const url = `${window.location.origin}/dashboard/studio/history/${current.uuid}`;
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
}
