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
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DeviceService } from '../../core/services/device.service';
import { StudioHistoryService } from '../../core/services/studio-history.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslationService } from '../../core/services/translation.service';
import { DeviceResponse } from '../../models/api.models';
import {
  StudioSessionSummary,
  StudioAuthorSummary,
  StudioHistoryFilterParams,
} from '../../models/studio-history.model';
import {
  PREDEFINED_LABELS,
  PredefinedLabel,
  isStandardStudioLabel,
  isCustomStudioLabel,
  isEdgeAiActivity,
  ActivityClassificationType,
  CUSTOM_LABEL_ICON,
  CUSTOM_LABEL_BADGE_CLASS,
} from '../../models/studio.model';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

import { DeviceSelectComponent } from '../../shared/components/device-select/device-select.component';
import { ActivitySelectComponent } from '../../shared/components/activity-select/activity-select.component';
import { AuthorSelectComponent } from '../../shared/components/author-select/author-select.component';
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
    AuthorSelectComponent,
    DateFilterComponent,
    StudioInspectionComponent,
  ],
  templateUrl: './studio-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudioHistoryComponent implements OnInit, OnDestroy {
  private readonly pageCursors = new Map<number, string | null>([[1, null]]);
  private readonly document = inject(DOCUMENT);
  readonly auth = inject(AuthService);
  private readonly studioHistoryService = inject(StudioHistoryService);
  private readonly deviceService = inject(DeviceService);
  private readonly toast = inject(ToastService);
  readonly translation = inject(TranslationService);
  private readonly route = inject(ActivatedRoute);

  readonly predefinedLabels: PredefinedLabel[] = PREDEFINED_LABELS;
  readonly isStandardStudioLabel = isStandardStudioLabel;
  readonly isCustomStudioLabel = isCustomStudioLabel;
  readonly isEdgeAiActivity = isEdgeAiActivity;
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
  readonly selectedLabels = signal<string[]>([]);
  readonly selectedDeviceId = signal<string>('');
  readonly selectedDeviceIds = signal<string[]>([]);
  readonly filterUserId = signal<string>('');
  readonly selectedUserIds = signal<(string | number)[]>([]);
  readonly authors = signal<StudioAuthorSummary[]>([]);
  readonly startDate = signal<string>('');
  readonly endDate = signal<string>('');
  readonly sampleCountMin = signal<number | null>(null);
  readonly sampleCountMax = signal<number | null>(null);
  readonly durationMin = signal<number | null>(null);
  readonly durationMax = signal<number | null>(null);
  readonly selectedValidated = signal<'all' | 'true' | 'false'>('all');
  readonly selectedHitl = signal<'all' | 'true' | 'false'>('all');
  readonly selectedClassification = signal<ActivityClassificationType>('all');
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
      this.selectedLabels().length > 0 ||
      Boolean(this.selectedLabel()) ||
      this.selectedDeviceIds().length > 0 ||
      Boolean(this.selectedDeviceId()) ||
      this.selectedUserIds().length > 0 ||
      Boolean(this.filterUserId()) ||
      Boolean(this.startDate()) ||
      Boolean(this.endDate()) ||
      this.sampleCountMin() !== null ||
      this.sampleCountMax() !== null ||
      this.durationMin() !== null ||
      this.durationMax() !== null ||
      this.selectedValidated() !== 'all' ||
      this.selectedHitl() !== 'all' ||
      this.selectedClassification() !== 'all'
    );
  });

  // Inspection Drawer State
  readonly inspectingSession = signal<StudioSessionSummary | null>(null);

  // Index of inspecting session or fallback index when session is evicted by status filter
  readonly currentSessionIndex = computed<number>(() => {
    const current = this.inspectingSession();
    if (!current) return -1;
    const foundIdx = this.sessions().findIndex((s) => (s.uuid ?? s.id) === (current.uuid ?? current.id));
    if (foundIdx >= 0) {
      return foundIdx;
    }
    return this.lastInspectedIndex();
  });

  private readonly lastInspectedIndex = signal<number>(-1);

  readonly hasPreviousSession = computed<boolean>(() => {
    if (this.isLoading()) return false;
    const idx = this.currentSessionIndex();
    if (idx > 0) return true;
    if (idx === 0 && this.page() > 1) return true;
    return false;
  });

  readonly hasNextSession = computed<boolean>(() => {
    if (this.isLoading()) return false;
    const idx = this.currentSessionIndex();
    const list = this.sessions();
    if (idx >= 0 && idx < list.length - 1) return true;
    if (idx >= 0 && idx === list.length - 1 && this.page() < this.totalPages()) return true;
    return false;
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
    const qp = this.route.snapshot.queryParams;
    if (qp['label']) {
      const labels = String(qp['label']).split(',').map((l) => l.trim()).filter(Boolean);
      if (labels.length > 0) {
        this.selectedLabels.set(labels);
        this.selectedLabel.set(labels.join(','));
      }
    }
    if (qp['is_validated'] !== undefined) {
      const val = String(qp['is_validated']).toLowerCase();
      if (val === 'true') {
        this.selectedValidated.set('true');
      } else if (val === 'false') {
        this.selectedValidated.set('false');
      }
    }
    if (qp['device_id']) {
      const devs = String(qp['device_id']).split(',').map((d) => d.trim()).filter(Boolean);
      if (devs.length > 0) {
        this.selectedDeviceIds.set(devs);
        this.selectedDeviceId.set(devs.join(','));
      }
    }
    if (qp['classification']) {
      const c = String(qp['classification']).toLowerCase();
      if (c === 'edge_ai' || c === 'research') {
        this.selectedClassification.set(c);
      }
    }

    this.loadDevices();
    if (this.isAdmin()) {
      this.loadAuthors();
    }
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

  refresh(): void {
    this.loadSessions();
  }

  loadAuthors(): void {
    this.studioHistoryService.getAuthors().subscribe({
      next: (authors) => this.authors.set(authors),
      error: () => {},
    });
  }

  loadSessions(onLoaded?: (items: StudioSessionSummary[]) => void): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const params: StudioHistoryFilterParams = {
      page: this.page(),
      size: this.size(),
    };
    const sampleCountMin = this.sampleCountMin();
    const sampleCountMax = this.sampleCountMax();
    const durationMin = this.durationMin();
    const durationMax = this.durationMax();
    const cursor = this.pageCursors.get(this.page());
    if (cursor) {
      params.cursor = cursor;
    }

    if (this.selectedLabels().length > 0) {
      params.label = this.selectedLabels();
    } else if (this.selectedLabel()) {
      params.label = this.selectedLabel();
    }

    if (this.selectedDeviceIds().length > 0) {
      params.device_id = this.selectedDeviceIds();
    } else if (this.selectedDeviceId()) {
      params.device_id = this.selectedDeviceId();
    }

    if (this.isAdmin()) {
      if (this.selectedUserIds().length > 0) {
        params.pseudonym = this.selectedUserIds().map(String);
      } else if (this.filterUserId().trim()) {
        params.pseudonym = this.filterUserId().trim();
      }
    }

    if (this.startDate()) {
      params.start_date = this.startDate();
    }
    if (this.endDate()) {
      params.end_date = this.endDate();
    }
    if (sampleCountMin !== null) {
      params.sample_count_min = sampleCountMin;
    }
    if (sampleCountMax !== null) {
      params.sample_count_max = sampleCountMax;
    }
    if (durationMin !== null) {
      params.duration_sec_min = durationMin;
    }
    if (durationMax !== null) {
      params.duration_sec_max = durationMax;
    }
    if (this.selectedValidated() === 'true') {
      params.is_validated = true;
    } else if (this.selectedValidated() === 'false') {
      params.is_validated = false;
    }
    if (this.selectedHitl() === 'true') {
      params.is_hitl = true;
    } else if (this.selectedHitl() === 'false') {
      params.is_hitl = false;
    }
    if (this.selectedClassification() !== 'all') {
      params.classification = this.selectedClassification();
    }

    this.studioHistoryService.getSessions(params).subscribe({
      next: (res) => {
        for (const cachedPage of this.pageCursors.keys()) {
          if (cachedPage > res.page) {
            this.pageCursors.delete(cachedPage);
          }
        }
        if (res.next_cursor) {
          this.pageCursors.set(res.page + 1, res.next_cursor);
        }
        this.sessions.set(res.items);
        this.total.set(res.total);
        this.page.set(res.page);
        this.size.set(res.size);
        this.isLoading.set(false);
        if (onLoaded) {
          onLoaded(res.items);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.status === 0
            ? this.translation.translate('studio_history.error_service_unavailable')
            : (err?.error?.detail ?? this.translation.translate('studio_history.error_loading'))
        );
      },
    });
  }

  toggleMobileFilters(): void {
    this.showMobileFilters.update((v) => !v);
  }

  onFilterChange(): void {
    this.resetPageCursors();
    this.page.set(1);
    this.loadSessions();
  }

  onLabelsChange(labels: string[]): void {
    this.selectedLabels.set(labels);
    this.selectedLabel.set(labels.join(','));
    this.onFilterChange();
  }

  onDeviceIdsChange(deviceIds: string[]): void {
    this.selectedDeviceIds.set(deviceIds);
    this.selectedDeviceId.set(deviceIds.join(','));
    this.onFilterChange();
  }

  onUserIdsChange(userIds: (string | number)[]): void {
    this.selectedUserIds.set(userIds);
    this.filterUserId.set(userIds.join(','));
    this.onFilterChange();
  }

  resetFilters(): void {
    this.selectedLabels.set([]);
    this.selectedLabel.set('');
    this.selectedDeviceIds.set([]);
    this.selectedDeviceId.set('');
    this.selectedUserIds.set([]);
    this.filterUserId.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.sampleCountMin.set(null);
    this.sampleCountMax.set(null);
    this.durationMin.set(null);
    this.durationMax.set(null);
    this.selectedValidated.set('all');
    this.selectedHitl.set('all');
    this.selectedClassification.set('all');
    this.resetPageCursors();
    this.page.set(1);
    this.loadSessions();
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages() || p === this.page()) {
      return;
    }
    // Keyset cursor exists for p? If not, fallback to direct offset page jump
    this.page.set(p);
    this.loadSessions();
  }

  onPageInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = parseInt(input.value, 10);
    if (!isNaN(val) && val >= 1 && val <= this.totalPages()) {
      if (val !== this.page()) {
        this.goToPage(val);
      }
    } else {
      input.value = this.page().toString();
    }
  }

  onPageSizeChange(newSize: number): void {
    this.size.set(newSize);
    this.resetPageCursors();
    this.page.set(1);
    this.loadSessions();
  }

  private resetPageCursors(): void {
    this.pageCursors.clear();
    this.pageCursors.set(1, null);
  }

  // --- Inspection Drawer Controls ---

  openInspection(session: StudioSessionSummary): void {
    this.inspectingSession.set(session);
    const idx = this.sessions().findIndex((s) => (s.uuid ?? s.id) === (session.uuid ?? session.id));
    if (idx >= 0) {
      this.lastInspectedIndex.set(idx);
    }
  }

  closeInspection(): void {
    this.inspectingSession.set(null);
    this.lastInspectedIndex.set(-1);
  }

  goToPreviousSession(): void {
    if (this.isLoading()) return;
    const idx = this.currentSessionIndex();
    if (idx > 0) {
      const prev = this.sessions()[idx - 1];
      this.openInspection(prev);
    } else if (idx === 0 && this.page() > 1) {
      this.page.update((p) => p - 1);
      this.loadSessions((newItems) => {
        if (newItems.length > 0) {
          this.openInspection(newItems[newItems.length - 1]);
        }
      });
    }
  }

  goToNextSession(): void {
    if (this.isLoading()) return;
    const idx = this.currentSessionIndex();
    const list = this.sessions();
    if (idx >= 0 && idx < list.length - 1) {
      const next = this.sessions()[idx + 1];
      this.openInspection(next);
    } else if (idx >= 0 && idx === list.length - 1 && this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
      this.loadSessions((newItems) => {
        if (newItems.length > 0) {
          this.openInspection(newItems[0]);
        }
      });
    }
  }

  onSessionUpdatedFromInspection(updated: StudioSessionSummary): void {
    this.inspectingSession.set(updated);
    this.sessions.update((items) =>
      items.map((it) => ((it.uuid ?? it.id) === (updated.uuid ?? updated.id) ? updated : it))
    );
    const statusFilter = this.selectedValidated();
    if (
      (statusFilter === 'true' && !updated.is_validated) ||
      (statusFilter === 'false' && updated.is_validated)
    ) {
      this.loadSessions();
    }
  }

  onSessionConfirmedFromInspection(confirmed: StudioSessionSummary): void {
    this.inspectingSession.set(confirmed);
    this.sessions.update((items) =>
      items.map((it) => ((it.uuid ?? it.id) === (confirmed.uuid ?? confirmed.id) ? confirmed : it))
    );
    const statusFilter = this.selectedValidated();
    if (
      (statusFilter === 'true' && !confirmed.is_validated) ||
      (statusFilter === 'false' && confirmed.is_validated)
    ) {
      this.loadSessions();
    }
  }

  onSessionDeletedFromInspection(sessionId: string): void {
    this.sessions.update((items) => items.filter((it) => (it.uuid ?? it.id) !== sessionId && it.id !== sessionId));
    this.total.update((t) => Math.max(0, t - 1));

    if ((this.inspectingSession()?.uuid ?? this.inspectingSession()?.id) === sessionId) {
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
    this.sessions.update((items) => items.filter((it) => (it.uuid ?? it.id) !== sessionId && it.id !== sessionId));
    this.total.update((t) => Math.max(0, t - 1));

    // Close inspection drawer if the deleted session was open
    if ((this.inspectingSession()?.uuid ?? this.inspectingSession()?.id) === sessionId) {
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
