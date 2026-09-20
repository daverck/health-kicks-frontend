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
import { ToastService } from '../../../core/services/toast.service';
import { TranslationService } from '../../../core/services/translation.service';
import { StudioSessionSummary } from '../../../models/studio-history.model';
import { ImuReading } from '../../../models/telemetry.models';
import { ImuChartComponent } from '../imu-chart/imu-chart.component';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { PREDEFINED_LABELS, PredefinedLabel, isStandardStudioLabel } from '../../../models/studio.model';
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
  ],
  templateUrl: './studio-inspection.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudioInspectionComponent implements OnInit, OnChanges {
  private readonly studioHistoryService = inject(StudioHistoryService);
  private readonly toast = inject(ToastService);
  readonly translation = inject(TranslationService);

  readonly predefinedLabels: PredefinedLabel[] = PREDEFINED_LABELS;

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
  readonly readingsError = signal<string | null>(null);

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
    if (!currentSession) return false;
    const target = this.effectiveEditLabel();
    return Boolean(target) && target !== currentSession.label;
  });

  ngOnInit(): void {
    const current = this.session();
    if (current) {
      this.initSessionState(current);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['session'] && this.session()) {
      this.initSessionState(this.session()!);
    }
  }

  private initSessionState(session: StudioSessionSummary): void {
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
    this.activeReadings.set([]);
    this.showDeleteConfirm.set(false);
    this.linkCopied.set(false);
    this.loadReadings(session.id);
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

  updateLabel(): void {
    const current = this.session();
    const newLabel = this.effectiveEditLabel();
    if (!current || !newLabel || newLabel === current.label) {
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

    this.isDeletingSession.set(true);
    this.studioHistoryService.deleteSession(current.id).subscribe({
      next: () => {
        this.isDeletingSession.set(false);
        this.showDeleteConfirm.set(false);
        this.toast.info(
          this.translation.translate('studio_history.session_deleted')
        );
        this.sessionDeleted.emit(current.id);
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
    return found ? found.icon : '🏷️';
  }
}

