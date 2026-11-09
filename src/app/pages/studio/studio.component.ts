import { Component, OnInit, OnDestroy, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ImuChartComponent } from '../../shared/components/imu-chart/imu-chart.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { TranslationService } from '../../core/services/translation.service';

import {
  PredefinedLabel,
  PREDEFINED_LABELS,
  SELECTED_DEVICE_STORAGE_KEY,
  StudioActivityCode,
  STANDARD_STUDIO_LABELS,
  STANDARD_STUDIO_LABEL_IDS,
  isStandardStudioLabel,
  isCustomStudioLabel,
  isEdgeAiActivity,
  CUSTOM_LABEL_ICON,
  CUSTOM_LABEL_BADGE_CLASS,
} from '../../models/studio.model';

export type { PredefinedLabel, StudioActivityCode };
export {
  PREDEFINED_LABELS,
  SELECTED_DEVICE_STORAGE_KEY,
  STANDARD_STUDIO_LABELS,
  STANDARD_STUDIO_LABEL_IDS,
  isStandardStudioLabel,
  isCustomStudioLabel,
  isEdgeAiActivity,
  CUSTOM_LABEL_ICON,
  CUSTOM_LABEL_BADGE_CLASS,
};

import { DeviceSelectComponent } from '../../shared/components/device-select/device-select.component';
import { Shoe3dViewerComponent } from '../../shared/components/shoe-3d-viewer/shoe-3d-viewer.component';
import { IsbGuideComponent } from '../../shared/components/isb-guide/isb-guide.component';
import { StudioActivityCardComponent } from './components/studio-activity-card.component';
import { StudioCustomActivityCardComponent } from './components/studio-custom-activity-card.component';
import { StudioCoverageSummaryComponent } from './components/studio-coverage-summary.component';
import { StudioCountdownStateComponent } from './components/studio-countdown-state.component';
import { StudioRecordingStateComponent } from './components/studio-recording-state.component';
import { StudioInspectionHeaderComponent } from './components/studio-inspection-header.component';
import { StudioRejectModalComponent } from './components/studio-reject-modal.component';
import { StudioLiveStore, StudioState } from './studio-live.store';

export type { StudioState };

@Component({
  selector: 'app-studio',
  standalone: true,
  providers: [StudioLiveStore],
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ImuChartComponent,
    TranslatePipe,
    DeviceSelectComponent,
    Shoe3dViewerComponent,
    IsbGuideComponent,
    StudioActivityCardComponent,
    StudioCustomActivityCardComponent,
    StudioCoverageSummaryComponent,
    StudioCountdownStateComponent,
    StudioRecordingStateComponent,
    StudioInspectionHeaderComponent,
    StudioRejectModalComponent,
  ],
  templateUrl: './studio.component.html',
})
export class StudioComponent implements OnInit, OnDestroy {
  readonly store = inject(StudioLiveStore);
  private readonly router = inject(Router);
  readonly translation = inject(TranslationService);

  readonly predefinedLabels = PREDEFINED_LABELS;
  readonly isStandardStudioLabel = isStandardStudioLabel;
  readonly isCustomStudioLabel = isCustomStudioLabel;
  readonly isEdgeAiActivity = isEdgeAiActivity;
  readonly customLabelIcon = CUSTOM_LABEL_ICON;

  readonly customCardComponent = viewChild<StudioCustomActivityCardComponent>('customCard');

  // Store bindings exposed for template and test compatibility
  readonly devices = this.store.devices;
  readonly selectedDeviceId = this.store.selectedDeviceId;
  readonly devicesLoading = this.store.devicesLoading;
  readonly devicesError = this.store.devicesError;
  readonly deviceSearchQuery = this.store.deviceSearchQuery;
  readonly isDeviceDropdownOpen = this.store.isDeviceDropdownOpen;
  readonly onlineDevices = this.store.onlineDevices;
  readonly filteredOnlineDevices = this.store.filteredOnlineDevices;
  readonly selectedDevice = this.store.selectedDevice;

  readonly state = this.store.state;
  readonly selectedLabel = this.store.selectedLabel;
  readonly customLabel = this.store.customLabel;
  readonly isCustomInputFocused = this.store.isCustomInputFocused;
  readonly effectiveLabel = this.store.effectiveLabel;
  readonly displayLabel = this.store.displayLabel;
  readonly isCustomCardActive = this.store.isCustomCardActive;

  readonly currentSession = this.store.currentSession;
  readonly readings = this.store.readings;
  readonly fetchingAttempt = this.store.fetchingAttempt;
  readonly fetchingError = this.store.fetchingError;
  readonly isDeleting = this.store.isDeleting;
  readonly isValidating = this.store.isValidating;
  readonly isRefreshingReadings = this.store.isRefreshingReadings;
  readonly showDeleteConfirm = this.store.showDeleteConfirm;
  readonly show3dViewer = this.store.show3dViewer;

  readonly targetPerClass = this.store.targetPerClass;
  readonly datasetStats = this.store.datasetStats;
  readonly isLoadingStats = this.store.isLoadingStats;
  readonly classesReachingTarget = this.store.classesReachingTarget;

  readonly countdownRemainingMs = this.store.countdownRemainingMs;
  readonly recordingProgressPercent = this.store.recordingProgressPercent;

  ngOnInit(): void {
    this.store.loadStats();
    this.store.loadDevices();
  }

  ngOnDestroy(): void {
    this.store.clearAllTimers();
  }

  toggle3dViewer(): void {
    this.store.toggle3dViewer();
  }

  getCountForLabel(label: string): number {
    return this.store.getCountForLabel(label);
  }

  getValidatedCountForLabel(label: string): number {
    return this.store.getValidatedCountForLabel(label);
  }

  getPendingCountForLabel(label: string): number {
    return this.store.getPendingCountForLabel(label);
  }

  getLabelDisplayName(label: string): string {
    return this.store.getLabelDisplayName(label);
  }

  navigateToHistoryWithFilter(event: Event, label: string, isValidated: boolean): void {
    event.stopPropagation();
    event.preventDefault();
    this.router.navigate(['/dashboard/studio/history'], {
      queryParams: {
        label,
        is_validated: isValidated,
      },
    });
  }

  loadStats(): void {
    this.store.loadStats();
  }

  loadDevices(): void {
    this.store.loadDevices();
  }

  onDeviceSelect(deviceId: string): void {
    this.store.onDeviceSelect(deviceId);
  }

  toggleDeviceDropdown(): void {
    this.store.toggleDeviceDropdown();
  }

  openDeviceDropdown(): void {
    this.store.openDeviceDropdown();
  }

  closeDeviceDropdown(): void {
    this.store.closeDeviceDropdown();
  }

  selectDevice(deviceId: string): void {
    this.store.selectDevice(deviceId);
  }

  selectLabel(labelId: string): void {
    this.store.selectLabel(labelId);
  }

  selectCustomCard(): void {
    this.focusCustomInput();
  }

  focusCustomInput(): void {
    this.customCardComponent()?.focusInput();
  }

  onCustomLabelChange(value: string): void {
    this.store.onCustomLabelChange(value);
  }

  clearCustomLabel(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.store.clearCustomLabel();
    this.focusCustomInput();
  }

  startCapture(): void {
    this.store.startSession();
  }

  fetchReadings(): void {
    this.store.runFetching();
  }

  deleteSession(): void {
    this.store.rejectSession();
  }

  startSession(): void {
    this.store.startSession();
  }

  runFetching(): void {
    this.store.runFetching();
  }

  refreshCurrentReadings(): void {
    this.store.refreshCurrentReadings();
  }

  validateSession(): void {
    this.store.validateSession();
  }

  rejectSession(): void {
    this.store.rejectSession();
  }

  confirmRejectSession(): void {
    this.store.confirmRejectSession();
  }

  cancelRejectPrompt(): void {
    this.store.cancelRejectPrompt();
  }

  exportJson(): void {
    this.store.exportJson();
  }

  resetToIdle(): void {
    this.store.resetToIdle();
  }
}
