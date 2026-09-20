import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeviceService } from '../../core/services/device.service';
import { StudioService } from '../../core/services/studio.service';
import { ToastService } from '../../core/services/toast.service';
import { DeviceResponse } from '../../models/api.models';
import { ImuReading, StudioStartResponse, StudioDatasetStats } from '../../models/telemetry.models';
import { ImuChartComponent } from '../../shared/components/imu-chart/imu-chart.component';

export type StudioState = 'idle' | 'countdown' | 'recording' | 'fetching' | 'inspecting';

import {
  PredefinedLabel,
  PREDEFINED_LABELS,
  SELECTED_DEVICE_STORAGE_KEY,
  StudioActivityCode,
  STANDARD_STUDIO_LABELS,
  STANDARD_STUDIO_LABEL_IDS,
  isStandardStudioLabel,
} from '../../models/studio.model';

export type { PredefinedLabel, StudioActivityCode };
export {
  PREDEFINED_LABELS,
  SELECTED_DEVICE_STORAGE_KEY,
  STANDARD_STUDIO_LABELS,
  STANDARD_STUDIO_LABEL_IDS,
  isStandardStudioLabel,
};

import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { TranslationService } from '../../core/services/translation.service';
import { StudioHistoryService } from '../../core/services/studio-history.service';
import { StudioSessionSummary } from '../../models/studio-history.model';
import { exportSessionToJson } from '../../core/utils/export.utils';

import { DeviceSelectComponent } from '../../shared/components/device-select/device-select.component';

@Component({
  selector: 'app-studio',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ImuChartComponent, TranslatePipe, DeviceSelectComponent],
  templateUrl: './studio.component.html',
})
export class StudioComponent implements OnInit, OnDestroy {
  private readonly deviceService = inject(DeviceService);
  private readonly studioService = inject(StudioService);
  private readonly studioHistoryService = inject(StudioHistoryService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly translation = inject(TranslationService);

  readonly predefinedLabels = PREDEFINED_LABELS;

  // Devices state
  readonly devices = signal<DeviceResponse[]>([]);
  readonly selectedDeviceId = signal<string>('');
  readonly devicesLoading = signal<boolean>(true);
  readonly devicesError = signal<boolean>(false);

  // Autocomplete & online filtering
  readonly deviceSearchQuery = signal<string>('');
  readonly isDeviceDropdownOpen = signal<boolean>(false);

  readonly onlineDevices = computed(() => {
    return this.devices().filter((d) => d.status === 'online');
  });

  readonly filteredOnlineDevices = computed(() => {
    const query = this.deviceSearchQuery().trim().toLowerCase();
    const online = this.onlineDevices();
    if (!query) {
      return online;
    }
    return online.filter(
      (d) =>
        (d.name && d.name.toLowerCase().includes(query)) ||
        d.device_id.toLowerCase().includes(query)
    );
  });

  readonly selectedDevice = computed(() => {
    const id = this.selectedDeviceId();
    return this.devices().find((d) => d.device_id === id) ?? null;
  });

  // Workflow state machine
  readonly state = signal<StudioState>('idle');
  readonly selectedLabel = signal<string>('walk');
  readonly customLabel = signal<string>('');

  readonly effectiveLabel = computed(() => {
    const custom = this.customLabel().trim();
    return custom.length > 0 ? custom : this.selectedLabel();
  });

  getLabelDisplayName(label: string): string {
    if (!label) return '';
    if (isStandardStudioLabel(label)) {
      const key = `studio.labels.${label}`;
      const translated = this.translation.translate(key);
      return translated !== key ? translated : label;
    }
    return label;
  }

  readonly displayLabel = computed(() => {
    return this.getLabelDisplayName(this.effectiveLabel());
  });

  // Session data
  readonly currentSession = signal<StudioStartResponse | null>(null);
  readonly readings = signal<ImuReading[]>([]);
  readonly fetchingAttempt = signal<number>(0);
  readonly fetchingError = signal<boolean>(false);
  readonly isDeleting = signal<boolean>(false);
  readonly isValidating = signal<boolean>(false);
  readonly showDeleteConfirm = signal<boolean>(false);

  // Dataset statistics & balance guidance
  readonly targetPerClass = 25;
  readonly datasetStats = signal<StudioDatasetStats>({ total_sessions: 0, by_label: {} });
  readonly isLoadingStats = signal<boolean>(false);

  readonly classesReachingTarget = computed(() => {
    const stats = this.datasetStats();
    return this.predefinedLabels.filter(
      (l) => (stats.by_label[l.id] ?? 0) >= this.targetPerClass
    ).length;
  });

  getCountForLabel(label: string): number {
    return this.datasetStats().by_label[label] ?? 0;
  }

  loadStats(): void {
    this.isLoadingStats.set(true);
    const deviceId = this.selectedDeviceId();
    this.studioService.getStudioStats(deviceId || undefined).subscribe({
      next: (stats) => {
        this.datasetStats.set(stats);
        this.isLoadingStats.set(false);
      },
      error: () => {
        this.isLoadingStats.set(false);
      },
    });
  }

  // Timers & visual progress
  readonly countdownRemainingMs = signal<number>(1500);
  readonly recordingProgressPercent = signal<number>(0);

  private countdownTimer?: ReturnType<typeof setTimeout>;
  private recordingInterval?: ReturnType<typeof setInterval>;
  private fetchingTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.loadStats();
    this.loadDevices();
  }

  ngOnDestroy(): void {
    this.clearAllTimers();
  }

  loadDevices(): void {
    this.devicesLoading.set(true);
    this.devicesError.set(false);

    this.deviceService.listDevices().subscribe({
      next: (devices) => {
        this.devices.set(devices);
        this.devicesLoading.set(false);
        const online = devices.filter((d) => d.status === 'online');
        if (online.length > 0) {
          const savedId = localStorage.getItem(SELECTED_DEVICE_STORAGE_KEY);
          const found = online.find((d) => d.device_id === savedId);
          const deviceToSelect = found ? found.device_id : online[0].device_id;
          this.selectedDeviceId.set(deviceToSelect);
          localStorage.setItem(SELECTED_DEVICE_STORAGE_KEY, deviceToSelect);
          this.loadStats();
        } else {
          this.selectedDeviceId.set('');
          this.loadStats();
        }
      },
      error: (err) => {
        this.devicesLoading.set(false);
        this.devicesError.set(true);
        this.toast.error(
          err?.status === 0
            ? 'Service temporairement indisponible, vérifiez votre connexion.'
            : 'Impossible de charger vos équipements.'
        );
      },
    });
  }

  onDeviceSelect(deviceId: string): void {
    this.selectedDeviceId.set(deviceId);
    if (deviceId) {
      localStorage.setItem(SELECTED_DEVICE_STORAGE_KEY, deviceId);
    }
    this.loadStats();
  }

  toggleDeviceDropdown(): void {
    if (this.state() !== 'idle') return;
    this.isDeviceDropdownOpen.update((open) => !open);
  }

  openDeviceDropdown(): void {
    if (this.state() !== 'idle') return;
    this.isDeviceDropdownOpen.set(true);
  }

  closeDeviceDropdown(): void {
    this.isDeviceDropdownOpen.set(false);
  }

  selectDevice(deviceId: string): void {
    this.onDeviceSelect(deviceId);
    this.closeDeviceDropdown();
    this.deviceSearchQuery.set('');
  }

  selectLabel(labelId: string): void {
    this.selectedLabel.set(labelId);
    this.customLabel.set('');
  }

  startCapture(): void {
    this.startSession();
  }

  fetchReadings(): void {
    this.runFetching();
  }

  deleteSession(): void {
    this.rejectSession();
  }

  /**
   * 1. Start Capture Command
   */
  startSession(): void {
    const deviceId = this.selectedDeviceId();
    if (!deviceId) {
      this.toast.error('Veuillez sélectionner un équipement avant de lancer une session.');
      return;
    }

    const isOnline = this.onlineDevices().some((d) => d.device_id === deviceId);
    if (!isOnline && this.devices().length > 0) {
      this.toast.error("L'équipement sélectionné n'est pas en ligne. Veuillez choisir un équipement connecté.");
      return;
    }

    const label = this.effectiveLabel();
    if (!label) {
      this.toast.error('Veuillez spécifier ou sélectionner un label pour la session.');
      return;
    }

    this.clearAllTimers();
    this.state.set('countdown');
    this.countdownRemainingMs.set(1500);
    this.recordingProgressPercent.set(0);
    this.fetchingError.set(false);
    this.readings.set([]);

    this.studioService.startStudioSession(deviceId, {
      label,
      duration_sec: 5,
      pulse_count: 3,
      pulse_duration_ms: 200,
      pulse_pause_ms: 200,
      pulse_intensity: 255,
    }).subscribe({
      next: (res) => {
        this.currentSession.set(res);
        this.runCountdown();
      },
      error: (err) => {
        this.state.set('idle');
        this.toast.error(
          err?.status === 0
            ? 'Service temporairement indisponible, vérifiez votre connexion.'
            : (err?.error?.detail ?? "Impossible d'initier la session Studio sur l'équipement.")
        );
      },
    });
  }

  /**
   * 2. Step: Countdown (~1.5s for 3 haptic pulses)
   */
  private runCountdown(): void {
    const startTime = Date.now();
    const duration = 1500;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      this.countdownRemainingMs.set(remaining);

      if (remaining > 0) {
        this.countdownTimer = setTimeout(tick, 50);
      } else {
        this.runRecording();
      }
    };

    tick();
  }

  /**
   * 3. Step: Recording (5.0s progress bar)
   */
  private runRecording(): void {
    this.state.set('recording');
    const totalDurationMs = 5000;
    const startTime = Date.now();

    this.recordingInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / totalDurationMs) * 100);
      this.recordingProgressPercent.set(progress);

      if (progress >= 100) {
        this.clearAllTimers();
        this.runFetching();
      }
    }, 50);
  }

  /**
   * 4. Step: Fetching telemetry from API with polling retry (800ms interval)
   */
  runFetching(): void {
    this.state.set('fetching');
    this.fetchingAttempt.set(0);
    this.fetchingError.set(false);
    this.pollReadings();
  }

  private pollReadings(): void {
    const session = this.currentSession();
    const deviceId = this.selectedDeviceId();
    if (!session || !deviceId) {
      this.state.set('idle');
      return;
    }

    const currentAttempt = this.fetchingAttempt() + 1;
    this.fetchingAttempt.set(currentAttempt);

    this.studioService.getSessionReadings(deviceId, session.session_id).subscribe({
      next: (res) => {
        if (res.readings && res.readings.length > 0) {
          this.readings.set(res.readings);
          this.state.set('inspecting');
          this.toast.success(`Télémétrie récupérée (${res.readings.length} points IMU enregistrés) !`);
        } else if (currentAttempt < 8) {
          // Retry after 800ms
          this.fetchingTimeout = setTimeout(() => this.pollReadings(), 800);
        } else {
          this.fetchingError.set(true);
        }
      },
      error: () => {
        if (currentAttempt < 8) {
          this.fetchingTimeout = setTimeout(() => this.pollReadings(), 800);
        } else {
          this.fetchingError.set(true);
        }
      },
    });
  }

  /**
   * 5. Step: Inspecting actions
   */
  validateSession(): void {
    const session = this.currentSession();
    if (!session) {
      this.resetToIdle();
      return;
    }

    this.isValidating.set(true);
    this.studioHistoryService.confirmSession(session.session_id).subscribe({
      next: () => {
        this.isValidating.set(false);
        this.toast.success(this.translation.translate('studio.confirm_success'));
        this.resetToIdle();
        this.loadStats();
        this.router.navigate(['/dashboard/studio/history']);
      },
      error: (err) => {
        this.isValidating.set(false);
        this.toast.error(
          err?.error?.detail ?? this.translation.translate('studio.confirm_error')
        );
      },
    });
  }

  rejectSession(): void {
    this.showDeleteConfirm.set(true);
  }

  confirmRejectSession(): void {
    const session = this.currentSession();

    if (!session) {
      this.resetToIdle();
      return;
    }

    this.isDeleting.set(true);
    this.studioHistoryService.deleteSession(session.session_id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.showDeleteConfirm.set(false);
        this.toast.info(this.translation.translate('studio.reject_success'));
        this.resetToIdle();
        this.loadStats();
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.showDeleteConfirm.set(false);
        this.toast.error(
          err?.error?.detail ?? 'Erreur lors de la suppression de la session.'
        );
        this.resetToIdle();
      },
    });
  }

  cancelRejectPrompt(): void {
    this.showDeleteConfirm.set(false);
  }

  exportJson(): void {
    const session = this.currentSession();
    const readings = this.readings();
    if (readings.length === 0) {
      this.toast.info(this.translation.translate('studio_history.export_no_data'));
      return;
    }
    const sessionSummary: StudioSessionSummary | null = session
      ? {
          id: session.session_id,
          device_id: session.device_id,
          user_id: 0,
          label: session.label || this.effectiveLabel(),
          sample_count: readings.length,
          duration_sec: session.duration_sec,
          created_at: new Date().toISOString(),
          is_validated: false,
        }
      : null;

    exportSessionToJson(sessionSummary, readings);
    this.toast.success(this.translation.translate('studio_history.export_success'));
  }

  resetToIdle(): void {
    this.clearAllTimers();
    this.state.set('idle');
    this.currentSession.set(null);
    this.readings.set([]);
    this.recordingProgressPercent.set(0);
    this.fetchingAttempt.set(0);
    this.fetchingError.set(false);
    this.isDeleting.set(false);
    this.isValidating.set(false);
    this.showDeleteConfirm.set(false);
  }

  private clearAllTimers(): void {
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = undefined;
    }
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = undefined;
    }
    if (this.fetchingTimeout) {
      clearTimeout(this.fetchingTimeout);
      this.fetchingTimeout = undefined;
    }
  }
}

