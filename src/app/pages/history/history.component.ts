import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { intensityToLevel } from '../../core/utils/haptic.utils';
import {
  PREDEFINED_LABELS,
  isStandardStudioLabel,
  isCustomStudioLabel,
  CUSTOM_LABEL_ICON,
  CUSTOM_LABEL_BADGE_CLASS,
} from '../../models/studio.model';
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
    const lower = eventType.toLowerCase();
    return lower.includes('fall');
  }

  getActivityIcon(eventType: string): string {
    const found = this.predefinedLabels.find((l) => l.id === eventType);
    if (found) return found.icon;
    if (this.isFall(eventType)) return '🚨';
    return CUSTOM_LABEL_ICON;
  }

  getActivityBadgeClass(eventType: string): string {
    if (this.isFall(eventType)) {
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300';
    }
    if (!isStandardStudioLabel(eventType)) {
      return CUSTOM_LABEL_BADGE_CLASS;
    }
    switch (eventType) {
      case 'idle':
        return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200';
      case 'walk':
      case 'run':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'stairs':
      case 'stumble_recover':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300';
      default:
        return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300';
    }
  }

  getActivityLabel(eventType: string): string {
    if (isStandardStudioLabel(eventType)) {
      const key = `studio.labels.${eventType}`;
      const translated = this.translation.translate(key);
      if (translated !== key) return translated;
    }
    const found = this.predefinedLabels.find((l) => l.id === eventType);
    return found ? found.name : eventType;
  }
}
