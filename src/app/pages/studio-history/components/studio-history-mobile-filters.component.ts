import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DateFilterComponent } from '../../../shared/components/date-filter/date-filter.component';
import { DeviceSelectComponent } from '../../../shared/components/device-select/device-select.component';
import { ActivitySelectComponent } from '../../../shared/components/activity-select/activity-select.component';
import { AuthorSelectComponent } from '../../../shared/components/author-select/author-select.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { DeviceResponse, UserSummaryResponse } from '../../../models/api.models';

@Component({
  selector: 'app-studio-history-mobile-filters',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DateFilterComponent,
    DeviceSelectComponent,
    ActivitySelectComponent,
    AuthorSelectComponent,
    TranslatePipe,
  ],
  templateUrl: './studio-history-mobile-filters.component.html',
})
export class StudioHistoryMobileFiltersComponent {
  @Input() hasActiveFilters = false;
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
}
