import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
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
import {
  PREDEFINED_LABELS,
  PredefinedLabel,
  isStandardStudioLabel,
  isCustomStudioLabel,
  CUSTOM_LABEL_ICON,
  CUSTOM_LABEL_BADGE_CLASS,
} from '../../models/studio.model';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

import { DeviceSelectComponent } from '../../shared/components/device-select/device-select.component';
import { ActivitySelectComponent } from '../../shared/components/activity-select/activity-select.component';
import { DateFilterComponent } from '../../shared/components/date-filter/date-filter.component';
import { StudioInspectionComponent } from '../../shared/components/studio-inspection/studio-inspection.component';

@Component({
  selector: 'app-studio-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslatePipe,
    DeviceSelectComponent,
    ActivitySelectComponent,
    DateFilterComponent,
    StudioInspectionComponent,
  ],
  templateUrl: './studio-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudioHistoryComponent implements OnInit, OnDestroy {
  private readonly document = inject(DOCUMENT);
  readonly auth = inject(AuthService);
  private readonly studioHistoryService = inject(StudioHistoryService);
  private readonly deviceService = inject(DeviceService);
  private readonly toast = inject(ToastService);
  readonly translation = inject(TranslationService);

  readonly predefinedLabels: PredefinedLabel[] = PREDEFINED_LABELS;
  readonly isStandardStudioLabel = isStandardStudioLabel;
  readonly isCustomStudioLabel = isCustomStudioLabel;
  readonly customLabelIcon = CUSTOM_LABEL_ICON;

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
  readonly startDate = signal<string>('');
  readonly endDate = signal<string>('');
  readonly selectedValidated = signal<'all' | 'true' | 'false'>('all');
  readonly devices = signal<DeviceResponse[]>([]);
  readonly showMobileFilters = signal<boolean>(false);

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
      Boolean(this.filterUserId()) ||
      Boolean(this.startDate()) ||
      Boolean(this.endDate()) ||
      this.selectedValidated() !== 'all'
    );
  });

  // Inspection Drawer State
  readonly inspectingSession = signal<StudioSessionSummary | null>(null);

  readonly currentSessionIndex = computed<number>(() => {
    const current = this.inspectingSession();
    if (!current) return -1;
    return this.sessions().findIndex((s) => s.id === current.id);
  });

  readonly hasPreviousSession = computed<boolean>(() => {
    return this.currentSessionIndex() > 0;
  });

  readonly hasNextSession = computed<boolean>(() => {
    const idx = this.currentSessionIndex();
    const list = this.sessions();
    return idx >= 0 && idx < list.length - 1;
  });

  // Direct List Deletion State
  readonly isDeletingSession = signal<boolean>(false);
  readonly deletingSessionIds = signal<Set<string>>(new Set());
  readonly sessionToDelete = signal<StudioSessionSummary | null>(null);

  constructor() {
    effect(() => {
      const isDrawerOpen = this.inspectingSession() !== null;
      if (isDrawerOpen) {
        this.document.body.classList.add('overflow-hidden');
      } else {
        this.document.body.classList.remove('overflow-hidden');
      }
    });
  }

  ngOnInit(): void {
    this.loadDevices();
    this.loadSessions();
  }

  ngOnDestroy(): void {
    this.document.body.classList.remove('overflow-hidden');
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
    if (this.startDate()) {
      params.start_date = this.startDate();
    }
    if (this.endDate()) {
      params.end_date = this.endDate();
    }
    if (this.selectedValidated() === 'true') {
      params.is_validated = true;
    } else if (this.selectedValidated() === 'false') {
      params.is_validated = false;
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

  toggleMobileFilters(): void {
    this.showMobileFilters.update((v) => !v);
  }

  onFilterChange(): void {
    this.page.set(1);
    this.loadSessions();
  }

  resetFilters(): void {
    this.selectedLabel.set('');
    this.selectedDeviceId.set('');
    this.filterUserId.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.selectedValidated.set('all');
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

  // --- Inspection Drawer Controls ---

  openInspection(session: StudioSessionSummary): void {
    this.inspectingSession.set(session);
  }

  closeInspection(): void {
    this.inspectingSession.set(null);
  }

  goToPreviousSession(): void {
    const idx = this.currentSessionIndex();
    if (idx > 0) {
      const prev = this.sessions()[idx - 1];
      this.openInspection(prev);
    }
  }

  goToNextSession(): void {
    const idx = this.currentSessionIndex();
    const list = this.sessions();
    if (idx >= 0 && idx < list.length - 1) {
      const next = this.sessions()[idx + 1];
      this.openInspection(next);
    }
  }

  onSessionUpdatedFromInspection(updated: StudioSessionSummary): void {
    this.inspectingSession.set(updated);
    this.sessions.update((items) =>
      items.map((it) => (it.id === updated.id ? updated : it))
    );
  }

  onSessionConfirmedFromInspection(confirmed: StudioSessionSummary): void {
    this.inspectingSession.set(confirmed);
    this.sessions.update((items) =>
      items.map((it) => (it.id === confirmed.id ? confirmed : it))
    );
  }

  onSessionDeletedFromInspection(sessionId: string): void {
    this.sessions.update((items) => items.filter((it) => it.id !== sessionId));
    this.total.update((t) => Math.max(0, t - 1));

    if (this.inspectingSession()?.id === sessionId) {
      this.closeInspection();
    }

    if (this.sessions().length === 0 && this.page() > 1) {
      this.page.update((p) => p - 1);
      this.loadSessions();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.sessionToDelete()) {
      this.cancelPromptDelete();
    } else if (this.inspectingSession()) {
      this.closeInspection();
    }
  }

  // --- Direct List Deletion Actions ---

  promptDeleteSession(session: StudioSessionSummary, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.sessionToDelete.set(session);
  }

  cancelPromptDelete(): void {
    this.sessionToDelete.set(null);
  }

  executeDeleteSession(sessionId: string): void {
    // Immediately dismiss confirmation popup and remove from list
    this.sessionToDelete.set(null);
    this.sessions.update((items) => items.filter((it) => it.id !== sessionId));
    this.total.update((t) => Math.max(0, t - 1));

    // Close inspection drawer if the deleted session was open
    if (this.inspectingSession()?.id === sessionId) {
      this.closeInspection();
    }

    this.deletingSessionIds.update((set) => {
      const next = new Set(set);
      next.add(sessionId);
      return next;
    });
    this.isDeletingSession.set(true);

    this.studioHistoryService.deleteSession(sessionId).subscribe({
      next: () => {
        this.deletingSessionIds.update((set) => {
          const next = new Set(set);
          next.delete(sessionId);
          this.isDeletingSession.set(next.size > 0);
          return next;
        });
        this.toast.info(
          this.translation.translate('studio_history.session_deleted')
        );

        // Reload current page if list became empty and page > 1
        if (this.sessions().length === 0 && this.page() > 1) {
          this.page.update((p) => p - 1);
          this.loadSessions();
        }
      },
      error: (err) => {
        this.deletingSessionIds.update((set) => {
          const next = new Set(set);
          next.delete(sessionId);
          this.isDeletingSession.set(next.size > 0);
          return next;
        });
        this.toast.error(
          err?.error?.detail ?? 'Erreur lors de la suppression de la session.'
        );
        // Reload sessions to restore list if server returned an error
        this.loadSessions();
      },
    });
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
