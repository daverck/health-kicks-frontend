import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DateFilterComponent } from '../../../shared/components/date-filter/date-filter.component';
import { DeviceSelectComponent } from '../../../shared/components/device-select/device-select.component';
import { ActivitySelectComponent } from '../../../shared/components/activity-select/activity-select.component';
import { AuthorSelectComponent } from '../../../shared/components/author-select/author-select.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { DeviceResponse, UserSummaryResponse } from '../../../models/api.models';
import { StudioSessionSummary } from '../../../models/studio-history.model';

@Component({
  selector: 'app-studio-history-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    DateFilterComponent,
    DeviceSelectComponent,
    ActivitySelectComponent,
    AuthorSelectComponent,
    TranslatePipe,
  ],
  templateUrl: './studio-history-table.component.html',
})
export class StudioHistoryTableComponent {
  @Input() sessions: StudioSessionSummary[] = [];
  @Input() isLoading = false;
  @Input() hasActiveFilters = false;
  @Input() inspectingSessionId: string | number | null = null;
  @Input() startDate: string | null = null;
  @Input() endDate: string | null = null;
  @Input() selectedValidated = 'all';
  @Input() selectedHitl = 'all';
  @Input() devices: DeviceResponse[] = [];
  @Input() selectedDeviceIds: string[] = [];
  @Input() selectedLabels: string[] = [];
  @Input() selectedClassification = 'all';
  @Input() sampleCountMin: number | null = null;
  @Input() sampleCountMax: number | null = null;
  @Input() durationMin: number | null = null;
  @Input() durationMax: number | null = null;
  @Input() isAdmin = false;
  @Input() authors: UserSummaryResponse[] = [];
  @Input() selectedUserIds: number[] = [];

  @Input({ required: true }) getLabelBadgeClass!: (label: string) => string;
  @Input({ required: true }) getLabelIcon!: (label: string) => string;
  @Input({ required: true }) getLabelDisplayName!: (label: string) => string;
  @Input({ required: true }) isEdgeAiActivity!: (label: string) => boolean;
  @Input({ required: true }) isCustomStudioLabel!: (label: string) => boolean;
  @Input({ required: true }) getAuthorDisplayName!: (s: StudioSessionSummary) => string;

  @Output() inspect = new EventEmitter<StudioSessionSummary>();
  @Output() delete = new EventEmitter<{ session: StudioSessionSummary; event: MouseEvent }>();
  @Output() resetFilters = new EventEmitter<void>();
  @Output() dateChange = new EventEmitter<{ startDate: string | null; endDate: string | null }>();
  @Output() validatedChange = new EventEmitter<string>();
  @Output() hitlChange = new EventEmitter<string>();
  @Output() deviceIdsChange = new EventEmitter<string[]>();
  @Output() labelsChange = new EventEmitter<string[]>();
  @Output() classificationChange = new EventEmitter<string>();
  @Output() sampleCountMinChange = new EventEmitter<number | null>();
  @Output() sampleCountMaxChange = new EventEmitter<number | null>();
  @Output() durationMinChange = new EventEmitter<number | null>();
  @Output() durationMaxChange = new EventEmitter<number | null>();
  @Output() userIdsChange = new EventEmitter<number[]>();

  onDelete(session: StudioSessionSummary, event: MouseEvent): void {
    event.stopPropagation();
    this.delete.emit({ session, event });
  }
}
