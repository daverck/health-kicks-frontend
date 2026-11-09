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
} from '../../models/studio.model';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import {
  getStudioLabelBadgeClass,
  getStudioLabelDisplayName,
  getStudioLabelIcon,
  getStudioUserPseudonymOrEmail,
} from '../../shared/formatters/studio-session.formatters';

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
    return getStudioUserPseudonymOrEmail(session);
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
