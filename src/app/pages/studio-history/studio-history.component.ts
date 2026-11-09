import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  inject,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { StudioSessionSummary } from '../../models/studio-history.model';
import {
  PREDEFINED_LABELS,
  PredefinedLabel,
  isStandardStudioLabel,
  isCustomStudioLabel,
  isEdgeAiActivity,
  CUSTOM_LABEL_ICON,
  CUSTOM_LABEL_BADGE_CLASS,
} from '../../models/studio.model';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

import { StudioInspectionComponent } from '../../shared/components/studio-inspection/studio-inspection.component';
import { StudioHistoryMobileFiltersComponent } from './components/studio-history-mobile-filters.component';
import { StudioHistoryMobileCardComponent } from './components/studio-history-mobile-card.component';
import { StudioHistoryTableComponent } from './components/studio-history-table.component';
import { StudioHistoryPaginationComponent } from './components/studio-history-pagination.component';
import { StudioHistoryDeleteModalComponent } from './components/studio-history-delete-modal.component';
import { StudioHistoryStore } from './studio-history.store';

@Component({
  selector: 'app-studio-history',
  standalone: true,
  providers: [StudioHistoryStore],
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslatePipe,
    StudioInspectionComponent,
    StudioHistoryMobileFiltersComponent,
    StudioHistoryMobileCardComponent,
    StudioHistoryTableComponent,
    StudioHistoryPaginationComponent,
    StudioHistoryDeleteModalComponent,
  ],
  templateUrl: './studio-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudioHistoryComponent implements OnInit, OnDestroy {
  private readonly document = inject(DOCUMENT);
  readonly store = inject(StudioHistoryStore);
  readonly auth = inject(AuthService);
  readonly translation = inject(TranslationService);
  private readonly route = inject(ActivatedRoute);

  readonly predefinedLabels: PredefinedLabel[] = PREDEFINED_LABELS;
  readonly isStandardStudioLabel = isStandardStudioLabel;
  readonly isCustomStudioLabel = isCustomStudioLabel;
  readonly isEdgeAiActivity = isEdgeAiActivity;
  readonly customLabelIcon = CUSTOM_LABEL_ICON;

  // Store bindings exposed for template and test compatibility
  readonly sessions = this.store.sessions;
  readonly total = this.store.total;
  readonly page = this.store.page;
  readonly size = this.store.size;
  readonly isLoading = this.store.isLoading;
  readonly errorMessage = this.store.errorMessage;
  readonly selectedLabel = this.store.selectedLabel;
  readonly selectedLabels = this.store.selectedLabels;
  readonly selectedDeviceId = this.store.selectedDeviceId;
  readonly selectedDeviceIds = this.store.selectedDeviceIds;
  readonly filterUserId = this.store.filterUserId;
  readonly selectedUserIds = this.store.selectedUserIds;
  readonly authors = this.store.authors;
  readonly startDate = this.store.startDate;
  readonly endDate = this.store.endDate;
  readonly sampleCountMin = this.store.sampleCountMin;
  readonly sampleCountMax = this.store.sampleCountMax;
  readonly durationMin = this.store.durationMin;
  readonly durationMax = this.store.durationMax;
  readonly selectedValidated = this.store.selectedValidated;
  readonly selectedHitl = this.store.selectedHitl;
  readonly selectedClassification = this.store.selectedClassification;
  readonly devices = this.store.devices;
  readonly showMobileFilters = this.store.showMobileFilters;
  readonly isAdmin = this.store.isAdmin;
  readonly totalPages = this.store.totalPages;
  readonly hasActiveFilters = this.store.hasActiveFilters;
  readonly isDeletingSession = this.store.isDeletingSession;
  readonly deletingSessionIds = this.store.deletingSessionIds;
  readonly sessionToDelete = this.store.sessionToDelete;

  // Inspection Drawer State (delegated to store)
  readonly inspectingSession = this.store.inspectingSession;
  readonly currentSessionIndex = this.store.currentSessionIndex;
  readonly isInspectingSessionEvicted = this.store.isInspectingSessionEvicted;
  readonly hasPreviousSession = this.store.hasPreviousSession;
  readonly hasNextSession = this.store.hasNextSession;

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

    this.store.loadDevices();
    if (this.isAdmin()) {
      this.store.loadAuthors();
    }
    this.store.loadSessions();
  }

  ngOnDestroy(): void {
    this.document.body.classList.remove('overflow-hidden');
  }

  loadDevices(): void {
    this.store.loadDevices();
  }

  loadAuthors(): void {
    this.store.loadAuthors();
  }

  loadSessions(onLoaded?: (items: StudioSessionSummary[]) => void): void {
    this.store.loadSessions(onLoaded);
  }

  refresh(): void {
    this.store.refresh();
  }

  toggleMobileFilters(): void {
    this.store.toggleMobileFilters();
  }

  onFilterChange(): void {
    this.store.onFilterChange();
  }

  onLabelsChange(labels: string[]): void {
    this.store.onLabelsChange(labels);
  }

  onDeviceIdsChange(deviceIds: string[]): void {
    this.store.onDeviceIdsChange(deviceIds);
  }

  onUserIdsChange(userIds: (string | number)[]): void {
    this.store.onUserIdsChange(userIds);
  }

  resetFilters(): void {
    this.store.resetFilters();
  }

  goToPage(p: number): void {
    this.store.goToPage(p);
  }

  onPageInput(event: Event): void {
    this.store.onPageInput(event);
  }

  onPageSizeChange(newSize: number): void {
    this.store.onPageSizeChange(newSize);
  }

  // --- Inspection Drawer Controls ---

  openInspection(session: StudioSessionSummary): void {
    this.store.openInspection(session);
  }

  closeInspection(): void {
    this.store.closeInspection();
  }

  goToPreviousSession(): void {
    this.store.goToPreviousSession();
  }

  goToNextSession(): void {
    this.store.goToNextSession();
  }

  onSessionUpdatedFromInspection(updated: StudioSessionSummary): void {
    this.store.onSessionUpdatedFromInspection(updated);
  }

  onSessionConfirmedFromInspection(confirmed: StudioSessionSummary): void {
    this.store.onSessionConfirmedFromInspection(confirmed);
  }

  onSessionDeletedFromInspection(sessionId: string): void {
    this.store.onSessionDeletedFromInspection(sessionId);
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
    this.store.promptDeleteSession(session, event);
  }

  cancelPromptDelete(): void {
    this.store.cancelPromptDelete();
  }

  executeDeleteSession(sessionId: string): void {
    if (this.inspectingSession()?.uuid === sessionId) {
      this.closeInspection();
    }
    this.store.executeDeleteSession(sessionId);
  }

  getAuthorDisplayName(session: StudioSessionSummary): string {
    if (session.is_pseudonymized) {
      return (
        session.author_name ||
        (session.subject_pseudonym ? `Patient ${session.subject_pseudonym}` : '—')
      );
    }
    return (
      session.user_email ||
      session.author_name ||
      (session.subject_pseudonym ? `Patient ${session.subject_pseudonym}` : '—')
    );
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
