import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, ThemeMode } from '../../../core/services/theme.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div
      class="inline-flex items-center rounded-lg bg-gray-100 p-0.5 sm:p-1 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700"
      role="group"
      [attr.aria-label]="'theme_toggle_label' | translate"
    >
      <button
        type="button"
        (click)="setTheme('light')"
        [class]="theme.themeMode() === 'light' ? 'bg-white text-amber-500 shadow-xs font-bold dark:bg-gray-700' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'"
        class="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md text-xs transition focus:outline-none focus:ring-2 focus:ring-primary-500"
        [attr.aria-label]="'theme_light' | translate"
        [attr.aria-pressed]="theme.themeMode() === 'light'"
        [title]="'theme_light' | translate"
        data-testid="theme-toggle-light"
      >
        <span>☀️</span>
      </button>

      <button
        type="button"
        (click)="setTheme('system')"
        [class]="theme.themeMode() === 'system' ? 'bg-white text-primary-600 shadow-xs font-bold dark:bg-gray-700 dark:text-primary-400' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'"
        class="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md text-xs transition focus:outline-none focus:ring-2 focus:ring-primary-500"
        [attr.aria-label]="'theme_system' | translate"
        [attr.aria-pressed]="theme.themeMode() === 'system'"
        [title]="'theme_system' | translate"
        data-testid="theme-toggle-system"
      >
        <span>💻</span>
      </button>

      <button
        type="button"
        (click)="setTheme('dark')"
        [class]="theme.themeMode() === 'dark' ? 'bg-white text-indigo-400 shadow-xs font-bold dark:bg-gray-700' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'"
        class="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md text-xs transition focus:outline-none focus:ring-2 focus:ring-primary-500"
        [attr.aria-label]="'theme_dark' | translate"
        [attr.aria-pressed]="theme.themeMode() === 'dark'"
        [title]="'theme_dark' | translate"
        data-testid="theme-toggle-dark"
      >
        <span>🌙</span>
      </button>
    </div>
  `,
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);

  setTheme(mode: ThemeMode): void {
    this.theme.setTheme(mode);
  }
}
