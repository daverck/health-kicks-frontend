import {
  Component,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../core/services/translation.service';
import { StudioSessionSummary } from '../../../models/studio-history.model';
import { ImuChartComponent } from '../imu-chart/imu-chart.component';
import { Shoe3dViewerComponent } from '../shoe-3d-viewer/shoe-3d-viewer.component';
import { IsbGuideComponent } from '../isb-guide/isb-guide.component';
import { StudioInspectionHeaderComponent } from './components/studio-inspection-header.component';
import { StudioInspectionLabelEditorComponent } from './components/studio-inspection-label-editor.component';
import { StudioInspectionTrimControlComponent } from './components/studio-inspection-trim-control.component';
import { TranslatePipe } from '../../pipes/translate.pipe';
import {
  PREDEFINED_LABELS,
  PredefinedLabel,
  isStandardStudioLabel,
  isCustomStudioLabel,
  isEdgeAiActivity,
  CUSTOM_LABEL_ICON,
} from '../../../models/studio.model';
import {
  getStudioLabelBadgeClass,
  getStudioLabelDisplayName,
  getStudioLabelIcon,
} from '../../formatters/studio-session.formatters';
import { StudioInspectionStore, MIN_TRIM_INTERVAL_SEC } from './studio-inspection.store';

@Component({
  selector: 'app-studio-inspection',
  standalone: true,
  providers: [StudioInspectionStore],
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
    TranslatePipe,
    ImuChartComponent,
    Shoe3dViewerComponent,
    IsbGuideComponent,
    StudioInspectionHeaderComponent,
    StudioInspectionLabelEditorComponent,
    StudioInspectionTrimControlComponent,
  ],
  templateUrl: './studio-inspection.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudioInspectionComponent implements OnInit, OnChanges {
  readonly minimumTrimDurationSec = MIN_TRIM_INTERVAL_SEC;

  readonly store = inject(StudioInspectionStore);
  readonly translation = inject(TranslationService);

  readonly predefinedLabels: PredefinedLabel[] = PREDEFINED_LABELS;
  readonly isStandardStudioLabel = isStandardStudioLabel;
  readonly isCustomStudioLabel = isCustomStudioLabel;
  readonly isEdgeAiActivity = isEdgeAiActivity;
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

  // State delegates from store
  readonly activeReadings = this.store.activeReadings;
  readonly isLoadingReadings = this.store.isLoadingReadings;
  readonly isValidatingSession = this.store.isValidatingSession;
  readonly isTrimmingSession = this.store.isTrimmingSession;
  readonly isUpdatingValidation = this.store.isUpdatingValidation;
  readonly readingsError = this.store.readingsError;
  readonly replayPlaybackTime = this.store.replayPlaybackTime;
  readonly show3dViewer = this.store.show3dViewer;
  readonly trimStartOffsetSec = this.store.trimStartOffsetSec;
  readonly trimEndOffsetSec = this.store.trimEndOffsetSec;
  readonly showTrimConfirm = this.store.showTrimConfirm;
  readonly showUnvalidateConfirm = this.store.showUnvalidateConfirm;

  readonly trimMaxDurationSec = this.store.trimMaxDurationSec;
  readonly trimDurationSec = this.store.trimDurationSec;
  readonly hasTrimChanges = this.store.hasTrimChanges;
  readonly trimPreviewReadings = this.store.trimPreviewReadings;

  readonly showLabelEditor = this.store.showLabelEditor;
  readonly labelEditMode = this.store.labelEditMode;
  readonly editLabelValue = this.store.editLabelValue;
  readonly customLabelValue = this.store.customLabelValue;
  readonly isUpdatingLabel = this.store.isUpdatingLabel;
  readonly isDeletingSession = this.store.isDeletingSession;
  readonly showDeleteConfirm = this.store.showDeleteConfirm;
  readonly linkCopied = this.store.linkCopied;
  readonly effectiveEditLabel = this.store.effectiveEditLabel;
  readonly canSaveLabel = this.store.canSaveLabel;

  ngOnInit(): void {
    const current = this.session();
    if (current && this.store.currentSessionId() !== current.uuid) {
      this.store.setSession(current);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['session']) {
      this.store.setSession(this.session());
    }
  }

  toggle3dViewer(): void {
    this.store.toggle3dViewer();
  }

  toggleLabelEditor(): void {
    this.store.toggleLabelEditor();
  }

  onReplayTimeSelected(timeSec: number): void {
    this.store.onReplayTimeSelected(timeSec);
  }

  onTrimHandleChanged(event: { handle: 'start' | 'end'; timeSec: number }): void {
    this.store.onTrimHandleChanged(event);
  }

  onTrimStartChanged(offsetSec: number): void {
    this.store.onTrimStartChanged(offsetSec);
  }

  onTrimEndChanged(offsetSec: number): void {
    this.store.onTrimEndChanged(offsetSec);
  }

  loadReadings(sessionId: string): void {
    this.store.loadReadings(sessionId);
  }

  confirmSession(): void {
    this.store.confirmSession((updated) => this.sessionConfirmed.emit(updated));
  }

  trimSession(): void {
    this.store.trimSession((updated) => this.sessionUpdated.emit(updated));
  }

  reopenSession(): void {
    this.store.reopenSession((updated) => this.sessionUpdated.emit(updated));
  }

  updateLabel(): void {
    this.store.updateLabel((updated) => this.sessionUpdated.emit(updated));
  }

  confirmDelete(): void {
    this.store.confirmDelete();
  }

  cancelDelete(): void {
    this.store.cancelDelete();
  }

  deleteSession(): void {
    this.store.deleteSession((sessionId) => this.sessionDeleted.emit(sessionId));
  }

  copyShareLink(): void {
    this.store.copyShareLink();
  }

  exportJson(): void {
    this.store.exportJson();
  }

  getLabelBadgeClass(label: string): string {
    return getStudioLabelBadgeClass(label);
  }

  getLabelDisplayName(label: string): string {
    return getStudioLabelDisplayName(label, this.translation);
  }

  getLabelIcon(labelId: string): string {
    return getStudioLabelIcon(labelId, this.predefinedLabels);
  }
}
