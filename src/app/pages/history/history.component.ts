import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { intensityToLevel } from '../../core/utils/haptic.utils';
import {
  PREDEFINED_LABELS,
  isStandardStudioLabel,
  isCustomStudioLabel,
  CUSTOM_LABEL_ICON,
} from '../../models/studio.model';
import {
  getStudioLabelBadgeClass,
  getStudioLabelDisplayName,
  getStudioLabelIcon,
} from '../../shared/formatters/studio-session.formatters';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { DeviceSelectComponent } from '../../shared/components/device-select/device-select.component';
import { ActivitySelectComponent } from '../../shared/components/activity-select/activity-select.component';
import { DateFilterComponent } from '../../shared/components/date-filter/date-filter.component';
import { HistoryStore } from './history.store';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    DeviceSelectComponent,
    ActivitySelectComponent,
    DateFilterComponent,
  ],
  providers: [HistoryStore],
  templateUrl: './history.component.html',
})
export class HistoryComponent implements OnInit {
  readonly store = inject(HistoryStore);
  private readonly translation = inject(TranslationService);

  readonly intensityToLevel = intensityToLevel;
  readonly predefinedLabels = PREDEFINED_LABELS;
  readonly isStandardStudioLabel = isStandardStudioLabel;
  readonly isCustomStudioLabel = isCustomStudioLabel;
  readonly customLabelIcon = CUSTOM_LABEL_ICON;

  // Store signals
  readonly devices = this.store.devices;
  readonly selectedDeviceId = this.store.selectedDeviceId;
  readonly selectedDeviceIds = this.store.selectedDeviceIds;
  readonly activeTab = this.store.activeTab;

  readonly events = this.store.events;
  readonly selectedEventType = this.store.selectedEventType;
  readonly selectedEventTypes = this.store.selectedEventTypes;
  readonly startDate = this.store.startDate;
  readonly endDate = this.store.endDate;
  readonly page = this.store.page;
  readonly pageSize = this.store.pageSize;
  readonly total = this.store.total;
  readonly totalPages = this.store.totalPages;
  readonly filteredEvents = this.store.filteredEvents;

  readonly hapticLogs = this.store.hapticLogs;
  readonly hapticStartDate = this.store.hapticStartDate;
  readonly hapticEndDate = this.store.hapticEndDate;
  readonly hapticPage = this.store.hapticPage;
  readonly hapticTotal = this.store.hapticTotal;
  readonly hapticTotalPages = this.store.hapticTotalPages;

  readonly loading = this.store.loading;
  readonly devicesError = this.store.devicesError;
  readonly eventsError = this.store.eventsError;

  ngOnInit(): void {
    this.store.loadDevices();
  }

  loadDevices(): void {
    this.store.loadDevices();
  }

  setTab(tab: 'activities' | 'haptic' | 'falls'): void {
    this.store.setTab(tab);
  }

  onEventTypeChange(ev: Event | string): void {
    this.store.onEventTypeChange(ev);
  }

  onEventTypesChange(types: string[]): void {
    this.store.onEventTypesChange(types);
  }

  onDateChange(range: { startDate: string; endDate: string }): void {
    this.store.onDateChange(range);
  }

  onHapticDateChange(range: { startDate: string; endDate: string }): void {
    this.store.onHapticDateChange(range);
  }

  onDeviceSelected(deviceId: string): void {
    this.store.onDeviceSelected(deviceId);
  }

  onDeviceIdsChange(deviceIds: string[]): void {
    this.store.onDeviceIdsChange(deviceIds);
  }

  onDeviceChange(ev: Event | string): void {
    this.store.onDeviceChange(ev);
  }

  goToPage(p: number): void {
    this.store.goToPage(p);
  }

  refresh(): void {
    this.store.refresh();
  }

  isFall(eventType: string): boolean {
    if (!eventType) return false;
    return eventType.toLowerCase().includes('fall');
  }

  getActivityIcon(eventType: string): string {
    return getStudioLabelIcon(eventType, this.predefinedLabels);
  }

  getActivityBadgeClass(eventType: string): string {
    return getStudioLabelBadgeClass(eventType);
  }

  getActivityLabel(eventType: string): string {
    return getStudioLabelDisplayName(eventType, this.translation, this.predefinedLabels);
  }
}
