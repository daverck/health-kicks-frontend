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

    if (typeof window !== 'undefined' && window.matchMedia) {
      this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQueryListener = (e: MediaQueryListEvent) => {
        if (this.themeMode() === 'system') {
          this.applyTheme(e.matches);
        }
      };

      if (this.mediaQueryList.addEventListener) {
        this.mediaQueryList.addEventListener('change', this.mediaQueryListener);
      } else if ((this.mediaQueryList as any).addListener) {
        (this.mediaQueryList as any).addListener(this.mediaQueryListener);
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

  private updateActiveTheme(mode: ThemeMode): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    let shouldBeDark = false;
    if (mode === 'dark') {
      shouldBeDark = true;
    } else if (mode === 'light') {
      shouldBeDark = false;
    } else {
      shouldBeDark =
        typeof window !== 'undefined' && window.matchMedia
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
          : false;
    }

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
