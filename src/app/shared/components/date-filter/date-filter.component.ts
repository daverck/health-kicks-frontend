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
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-date-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './date-filter.component.html',
})
export class DateFilterComponent {
  private readonly elementRef = inject(ElementRef);
  private readonly translationService = inject(TranslationService);

  // Two-way date bounds (format: 'YYYY-MM-DD')
  readonly startDate = model<string>('');
  readonly endDate = model<string>('');

  // Styling & Options
  readonly size = input<'sm' | 'md'>('sm');
  readonly fullWidth = input<boolean>(false);
  readonly placeholder = input<string>('');
  readonly triggerId = input<string>('date-filter-trigger');
  readonly dropdownAlign = input<'left' | 'right'>('left');

  // Outputs
  readonly dateChange = output<{ startDate: string; endDate: string }>();

  // Internal state
  readonly isOpen = signal<boolean>(false);
  readonly tempStartDate = signal<string>('');
  readonly tempEndDate = signal<string>('');

  readonly hasActiveFilter = computed<boolean>(() => {
    return Boolean(this.startDate() || this.endDate());
  });

  readonly displayLabel = computed<string>(() => {
    const s = this.startDate();
    const e = this.endDate();

    if (!s && !e) {
      return this.placeholder() || this.translationService.translate('date_filter.all_dates');
    }

    const sFmt = this.formatDateDisplay(s);
    const eFmt = this.formatDateDisplay(e);

    if (s && e) {
      if (s === e) {
        return sFmt;
      }
      return `${sFmt} → ${eFmt}`;
    }

    if (s) {
      return this.translationService.translate('date_filter.from_date', { date: sFmt });
    }

    return this.translationService.translate('date_filter.to_date', { date: eFmt });
  });

  readonly triggerSizeClasses = computed<string>(() => {
    return this.size() === 'sm'
      ? 'rounded-lg px-2.5 py-1.5 text-xs'
      : 'rounded-xl px-4 py-2 text-sm';
  });

  readonly dropdownAlignmentClass = computed<string>(() => {
    return this.dropdownAlign() === 'right' ? 'right-0' : 'left-0';
  });

  toggleDropdown(): void {
    if (this.isOpen()) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown(): void {
    this.tempStartDate.set(this.startDate());
    this.tempEndDate.set(this.endDate());
    this.isOpen.set(true);
  }

  closeDropdown(): void {
    this.isOpen.set(false);
  }

  applyPreset(preset: 'today' | 'yesterday' | '7days' | '30days'): void {
    const now = new Date();
    let start = '';
    let end = '';

    if (preset === 'today') {
      start = this.formatToYMD(now);
      end = start;
    } else if (preset === 'yesterday') {
      const yesterday = new Date(now.getTime() - 86400000);
      start = this.formatToYMD(yesterday);
      end = start;
    } else if (preset === '7days') {
      const sevenDaysAgo = new Date(now.getTime() - 6 * 86400000);
      start = this.formatToYMD(sevenDaysAgo);
      end = this.formatToYMD(now);
    } else if (preset === '30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 29 * 86400000);
      start = this.formatToYMD(thirtyDaysAgo);
      end = this.formatToYMD(now);
    }

    this.tempStartDate.set(start);
    this.tempEndDate.set(end);
    this.apply();
  }

  apply(): void {
    let s = this.tempStartDate();
    let e = this.tempEndDate();

    // Auto-order if user inverted dates
    if (s && e && s > e) {
      const tmp = s;
      s = e;
      e = tmp;
    }

    this.startDate.set(s);
    this.endDate.set(e);
    this.dateChange.emit({ startDate: s, endDate: e });
    this.closeDropdown();
  }

  clear(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.tempStartDate.set('');
    this.tempEndDate.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.dateChange.emit({ startDate: '', endDate: '' });
    this.closeDropdown();
  }

  formatDateDisplay(ymd: string): string {
    if (!ymd) return '';
    const parts = ymd.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return ymd;
  }

  private formatToYMD(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.closeDropdown();
    }
  }
}
