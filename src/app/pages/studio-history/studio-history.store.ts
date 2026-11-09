import { Injectable, inject, signal, computed } from '@angular/core';
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
import { ActivityClassificationType } from '../../models/studio.model';

@Injectable()
export class StudioHistoryStore {
  private readonly pageCursors = new Map<number, string | null>([[1, null]]);
  readonly auth = inject(AuthService);
  private readonly studioHistoryService = inject(StudioHistoryService);
  private readonly deviceService = inject(DeviceService);
  private readonly toast = inject(ToastService);
  readonly translation = inject(TranslationService);

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

  // Direct List Deletion State
  readonly isDeletingSession = signal<boolean>(false);
  readonly deletingSessionIds = signal<Set<string>>(new Set());
  readonly sessionToDelete = signal<StudioSessionSummary | null>(null);

  // Computeds
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

  loadDevices(): void {
    this.deviceService.listDevices().subscribe({
      next: (devs) => this.devices.set(devs),
      error: () => {},
    });
  }

  loadAuthors(): void {
    this.studioHistoryService.getAuthors().subscribe({
      next: (authors) => this.authors.set(authors),
      error: () => {},
    });
  }

  refresh(): void {
    this.loadSessions();
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

  resetPageCursors(): void {
    this.pageCursors.clear();
    this.pageCursors.set(1, null);
  }

  promptDeleteSession(session: StudioSessionSummary, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.sessionToDelete.set(session);
  }

  cancelPromptDelete(): void {
    this.sessionToDelete.set(null);
  }

  executeDeleteSession(sessionId: string, onDeleted?: () => void): void {
    this.sessionToDelete.set(null);
    this.sessions.update((items) => items.filter((it) => it.uuid !== sessionId));
    this.total.update((t) => Math.max(0, t - 1));

    onDeleted?.();

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
        this.loadSessions();
      },
    });
  }

  onSessionUpdated(updated: StudioSessionSummary): void {
    this.sessions.update((items) =>
      items.map((it) => (it.uuid === updated.uuid ? updated : it))
    );
    const statusFilter = this.selectedValidated();
    if (
      (statusFilter === 'true' && !updated.is_validated) ||
      (statusFilter === 'false' && updated.is_validated)
    ) {
      this.loadSessions();
    }
  }

  onSessionConfirmed(confirmed: StudioSessionSummary): void {
    this.sessions.update((items) =>
      items.map((it) => (it.uuid === confirmed.uuid ? confirmed : it))
    );
    const statusFilter = this.selectedValidated();
    if (
      (statusFilter === 'true' && !confirmed.is_validated) ||
      (statusFilter === 'false' && confirmed.is_validated)
    ) {
      this.loadSessions();
    }
  }

  onSessionDeleted(sessionId: string): void {
    this.sessions.update((items) => items.filter((it) => it.uuid !== sessionId));
    this.total.update((t) => Math.max(0, t - 1));

    if (this.sessions().length === 0 && this.page() > 1) {
      this.page.update((p) => p - 1);
      this.loadSessions();
    }
  }
}
