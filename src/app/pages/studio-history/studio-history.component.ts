import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DeviceService } from '../../core/services/device.service';
import { StudioHistoryService } from '../../core/services/studio-history.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslationService } from '../../core/services/translation.service';
import { DeviceResponse } from '../../models/api.models';
import {
  StudioSessionSummary,
  StudioHistoryFilterParams,
} from '../../models/studio-history.model';
import { ImuReading } from '../../models/telemetry.models';
import { ImuChartComponent } from '../../shared/components/imu-chart/imu-chart.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { PREDEFINED_LABELS, PredefinedLabel } from '../studio/studio.component';

@Component({
  selector: 'app-studio-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslatePipe,
    ImuChartComponent,
  ],
  templateUrl: './studio-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudioHistoryComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly studioHistoryService = inject(StudioHistoryService);
  private readonly deviceService = inject(DeviceService);
  private readonly toast = inject(ToastService);
  readonly translation = inject(TranslationService);

  readonly predefinedLabels: PredefinedLabel[] = PREDEFINED_LABELS;

  // Pagination & List State
  readonly sessions = signal<StudioSessionSummary[]>([]);
  readonly total = signal<number>(0);
  readonly page = signal<number>(1);
  readonly size = signal<number>(20);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Filters State
  readonly selectedLabel = signal<string>('');
  readonly selectedDeviceId = signal<string>('');
  readonly filterUserId = signal<string>('');
  readonly devices = signal<DeviceResponse[]>([]);

  // RBAC & Computeds
  readonly isAdmin = computed(() => this.auth.user()?.role === 'admin');

  readonly totalPages = computed(() => {
    const s = this.size();
    const t = this.total();
    return Math.max(1, Math.ceil(t / s));
  });

  readonly hasActiveFilters = computed(() => {
    return (
      Boolean(this.selectedLabel()) ||
      Boolean(this.selectedDeviceId()) ||
      Boolean(this.filterUserId())
    );
  });

  // Inspection Drawer State
  readonly inspectingSession = signal<StudioSessionSummary | null>(null);
  readonly activeReadings = signal<ImuReading[]>([]);
  readonly isLoadingReadings = signal<boolean>(false);
  readonly readingsError = signal<string | null>(null);

  // Curation State inside Drawer
  readonly editLabelValue = signal<string>('');
  readonly isUpdatingLabel = signal<boolean>(false);
  readonly isDeletingSession = signal<boolean>(false);
  readonly showDeleteConfirm = signal<boolean>(false);

  ngOnInit(): void {
    this.loadDevices();
    this.loadSessions();
  }

  loadDevices(): void {
    this.deviceService.listDevices().subscribe({
      next: (devs) => this.devices.set(devs),
      error: () => {},
    });
  }

  loadSessions(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const params: StudioHistoryFilterParams = {
      page: this.page(),
      size: this.size(),
    };

    if (this.selectedLabel()) {
      params.label = this.selectedLabel();
    }
    if (this.selectedDeviceId()) {
      params.device_id = this.selectedDeviceId();
    }
    if (this.isAdmin() && this.filterUserId().trim()) {
      const parsed = parseInt(this.filterUserId().trim(), 10);
      if (!isNaN(parsed)) {
        params.user_id = parsed;
      }
    }

    this.studioHistoryService.getSessions(params).subscribe({
      next: (res) => {
        this.sessions.set(res.items);
        this.total.set(res.total);
        this.page.set(res.page);
        this.size.set(res.size);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.status === 0
            ? 'Service temporairement indisponible, vérifiez votre connexion.'
            : (err?.error?.detail ?? 'Impossible de charger l’historique des sessions.')
        );
      },
    });
  }

  onFilterChange(): void {
    this.page.set(1);
    this.loadSessions();
  }

  resetFilters(): void {
    this.selectedLabel.set('');
    this.selectedDeviceId.set('');
    this.filterUserId.set('');
    this.page.set(1);
    this.loadSessions();
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages() || p === this.page()) {
      return;
    }
    this.page.set(p);
    this.loadSessions();
  }

  onPageSizeChange(newSize: number): void {
    this.size.set(newSize);
    this.page.set(1);
    this.loadSessions();
  }

  // --- Inspection & Telemetry Visualisation ---

  openInspection(session: StudioSessionSummary): void {
    this.inspectingSession.set(session);
    this.editLabelValue.set(session.label);
    this.activeReadings.set([]);
    this.showDeleteConfirm.set(false);
    this.loadReadings(session.id);
  }

  closeInspection(): void {
    this.inspectingSession.set(null);
    this.activeReadings.set([]);
    this.readingsError.set(null);
    this.showDeleteConfirm.set(false);
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

  // --- Curation Actions ---

  updateLabel(): void {
    const session = this.inspectingSession();
    const newLabel = this.editLabelValue().trim();
    if (!session || !newLabel || newLabel === session.label) {
      return;
    }

    this.isUpdatingLabel.set(true);
    this.studioHistoryService.updateSessionLabel(session.id, newLabel).subscribe({
      next: (updated) => {
        this.isUpdatingLabel.set(false);
        this.toast.success(
          this.translation.translate('studio_history.label_updated')
        );

        // Update local session
        this.inspectingSession.set({ ...session, label: updated.label });
        this.sessions.update((items) =>
          items.map((it) => (it.id === session.id ? { ...it, label: updated.label } : it))
        );
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
    const session = this.inspectingSession();
    if (!session) return;

    this.isDeletingSession.set(true);
    this.studioHistoryService.deleteSession(session.id).subscribe({
      next: () => {
        this.isDeletingSession.set(false);
        this.showDeleteConfirm.set(false);
        this.toast.info(
          this.translation.translate('studio_history.session_deleted')
        );

        // Remove from list
        this.sessions.update((items) => items.filter((it) => it.id !== session.id));
        this.total.update((t) => Math.max(0, t - 1));
        this.closeInspection();

        // Reload current page if list became empty and page > 1
        if (this.sessions().length === 0 && this.page() > 1) {
          this.page.update((p) => p - 1);
          this.loadSessions();
        }
      },
      error: (err) => {
        this.isDeletingSession.set(false);
        this.toast.error(
          err?.error?.detail ?? 'Erreur lors de la suppression de la session.'
        );
      },
    });
  }

  getLabelBadgeClass(label: string): string {
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

  getLabelIcon(labelId: string): string {
    const found = this.predefinedLabels.find((l) => l.id === labelId);
    return found ? found.icon : '🏷️';
  }
}
