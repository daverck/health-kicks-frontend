import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ScreenshotItem } from '../home.component';

export type ScreenshotCardTheme = 'primary' | 'emergency';

@Component({
  selector: 'app-home-screenshot-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <button
      type="button"
      (click)="cardClick.emit()"
      class="group relative text-left rounded-2xl border transition-all cursor-pointer block w-full"
      [class]="containerClasses()"
    >
      <div class="flex items-center justify-between mb-2">
        <span
          class="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold"
          [class]="badgeClasses()"
        >
          @if (iconType() === 'mobile') {
            <svg class="h-3 w-3 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
            </svg>
          }
          <span>{{ item().tag }}</span>
        </span>
        <span
          class="text-xs font-mono font-semibold"
          [class]="indexClasses()"
        >
          {{ stepPrefix() }}0{{ index() + 1 }}
        </span>
      </div>
      <h3
        class="font-bold text-gray-900 dark:text-white transition"
        [class]="titleClasses()"
      >
        {{ item().titleKey | translate }}
      </h3>
      <p
        class="mt-1.5 text-xs leading-relaxed text-gray-600 dark:text-gray-400"
        [class]="dense() ? 'sm:text-sm' : ''"
      >
        {{ item().descKey | translate }}
      </p>
    </button>
  `,
})
export class HomeScreenshotCardComponent {
  readonly item = input.required<ScreenshotItem>();
  readonly index = input.required<number>();
  readonly isSelected = input<boolean>(false);
  readonly theme = input<ScreenshotCardTheme>('primary');
  readonly stepPrefix = input<string>('');
  readonly iconType = input<'none' | 'mobile'>('none');
  readonly dense = input<boolean>(false);

  readonly cardClick = output<void>();

  readonly containerClasses = computed(() => {
    const selected = this.isSelected();
    const isEmergency = this.theme() === 'emergency';
    const padding = this.dense() ? 'p-4 sm:p-5' : 'p-5';

    if (isEmergency) {
      return selected
        ? `${padding} border-red-500 dark:border-red-500 bg-red-50/50 dark:bg-red-950/40 ring-2 ring-red-500/20 shadow-md`
        : `${padding} border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-red-300 dark:hover:border-red-900/60 hover:shadow-sm`;
    }

    return selected
      ? `${padding} border-primary-500 dark:border-primary-500 bg-primary-50/40 dark:bg-primary-950/40 ring-2 ring-primary-500/20 shadow-md`
      : `${padding} border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm`;
  });

  readonly badgeClasses = computed(() => {
    const selected = this.isSelected();
    const isEmergency = this.theme() === 'emergency';

    if (isEmergency) {
      return selected
        ? 'bg-red-100 dark:bg-red-900/70 text-red-800 dark:text-red-200'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }

    return selected
      ? 'bg-primary-100 dark:bg-primary-900/60 text-primary-800 dark:text-primary-300'
      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
  });

  readonly indexClasses = computed(() => {
    const selected = this.isSelected();
    const isEmergency = this.theme() === 'emergency';

    if (isEmergency) {
      return selected ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500';
    }

    return selected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500';
  });

  readonly titleClasses = computed(() => {
    const isEmergency = this.theme() === 'emergency';
    const textSize = this.dense() ? 'text-sm sm:text-base' : 'text-base';
    const hoverColor = isEmergency
      ? 'group-hover:text-red-600 dark:group-hover:text-red-400'
      : 'group-hover:text-primary-600 dark:group-hover:text-primary-400';

    return `${textSize} ${hoverColor}`;
  });
}
