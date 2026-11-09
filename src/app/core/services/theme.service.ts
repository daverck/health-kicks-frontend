import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';

export type ThemeMode = 'light' | 'dark' | 'system';
export const THEME_STORAGE_KEY = 'hk_theme';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  private mediaQueryListener?: (e: MediaQueryListEvent) => void;
  private mediaQueryList?: MediaQueryList;

  readonly themeMode = signal<ThemeMode>('system');
  readonly isDark = signal<boolean>(false);

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    let initialMode: ThemeMode = 'system';
    try {
      const storedMode = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (storedMode === 'light' || storedMode === 'dark' || storedMode === 'system') {
        initialMode = storedMode;
      }
    } catch {
      // Ignore storage access errors
    }

    this.themeMode.set(initialMode);

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQueryListener = (e: MediaQueryListEvent) => {
        if (this.themeMode() === 'system') {
          this.applyTheme(e.matches);
        }
      };

      if ('addEventListener' in this.mediaQueryList) {
        this.mediaQueryList.addEventListener('change', this.mediaQueryListener);
      } else {
        // Fallback for legacy environments that implement addListener
        (this.mediaQueryList as unknown as { addListener?: (fn: (e: MediaQueryListEvent) => void) => void }).addListener?.(
          this.mediaQueryListener
        );
      }
    }

    this.updateActiveTheme(initialMode);
  }

  setTheme(mode: ThemeMode): void {
    this.themeMode.set(mode);
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, mode);
      } catch {
        // Ignore storage write errors
      }
    }
    this.updateActiveTheme(mode);
  }

  toggleTheme(): void {
    const nextMode: ThemeMode = this.isDark() ? 'light' : 'dark';
    this.setTheme(nextMode);
  }

  private resolveDarkPreference(mode: ThemeMode): boolean {
    if (mode === 'dark') {
      return true;
    }
    if (mode === 'light') {
      return false;
    }
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false;
  }

  private updateActiveTheme(mode: ThemeMode): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const shouldBeDark = this.resolveDarkPreference(mode);
    this.applyTheme(shouldBeDark);
  }

  private applyTheme(dark: boolean): void {
    this.isDark.set(dark);
    const root = this.document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}
