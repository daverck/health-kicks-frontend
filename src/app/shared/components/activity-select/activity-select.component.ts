import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PredefinedLabel, PREDEFINED_LABELS } from '../../../models/studio.model';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-activity-select',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './activity-select.component.html',
})
export class ActivitySelectComponent {
  private readonly elementRef = inject(ElementRef);

  // Inputs & Two-way model
  readonly selectedActivity = model<string>('');
  readonly labels = input<PredefinedLabel[]>(PREDEFINED_LABELS);

  readonly allowAll = input<boolean>(true);
  readonly allValue = input<string>('');
  readonly allLabel = input<string>('');

  readonly includeFalls = input<boolean>(false);
  readonly fallsValue = input<string>('falls');
  readonly fallsLabel = input<string>('');

  readonly disabled = input<boolean>(false);
  readonly size = input<'sm' | 'md'>('md');
  readonly fullWidth = input<boolean>(false);
  readonly placeholder = input<string>('');
  readonly triggerId = input<string>('activity-select-trigger');

  // Outputs
  readonly activityChange = output<string>();

  // Internal state
  readonly isOpen = signal<boolean>(false);
  readonly searchQuery = signal<string>('');

  // Resolution of current selected state
  readonly isAllSelected = computed<boolean>(() => {
    if (!this.allowAll()) return false;
    const current = this.selectedActivity();
    const targetAll = this.allValue();
    return current === targetAll || (!current && !targetAll);
  });

  readonly isFallsSelected = computed<boolean>(() => {
    if (!this.includeFalls()) return false;
    return this.selectedActivity() === this.fallsValue();
  });

  readonly currentLabel = computed<PredefinedLabel | null>(() => {
    if (this.isAllSelected() || this.isFallsSelected()) return null;
    const id = this.selectedActivity();
    if (!id) return null;
    return this.labels().find((l) => l.id === id) ?? null;
  });

  // Filtered labels based on search query
  readonly filteredLabels = computed<PredefinedLabel[]>(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const list = this.labels();
    if (!query) return list;
    return list.filter(
      (l) =>
        l.id.toLowerCase().includes(query) ||
        (l.name && l.name.toLowerCase().includes(query)) ||
        (l.description && l.description.toLowerCase().includes(query))
    );
  });

  readonly triggerSizeClasses = computed<string>(() => {
    return this.size() === 'sm'
      ? 'rounded-lg px-3 py-1.5 text-xs'
      : 'rounded-xl px-4 py-2 text-sm';
  });

  toggleDropdown(): void {
    if (this.disabled()) return;
    this.isOpen.update((open) => !open);
    if (!this.isOpen()) {
      this.searchQuery.set('');
    }
  }

  closeDropdown(): void {
    this.isOpen.set(false);
    this.searchQuery.set('');
  }

  selectAll(): void {
    const val = this.allValue();
    this.selectedActivity.set(val);
    this.activityChange.emit(val);
    this.closeDropdown();
  }

  selectFalls(): void {
    const val = this.fallsValue();
    this.selectedActivity.set(val);
    this.activityChange.emit(val);
    this.closeDropdown();
  }

  selectLabel(label: PredefinedLabel): void {
    this.selectedActivity.set(label.id);
    this.activityChange.emit(label.id);
    this.closeDropdown();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.closeDropdown();
    }
  }
}
