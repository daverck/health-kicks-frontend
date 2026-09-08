import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  SupportedLang,
  LanguageMeta,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
} from '../i18n/i18n.models';
import { LOCALES } from '../i18n/locales';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly currentLang = signal<SupportedLang>(DEFAULT_LANGUAGE);

  readonly currentMeta = computed<LanguageMeta>(() => {
    const code = this.currentLang();
    return (
      SUPPORTED_LANGUAGES.find((l) => l.code === code) ?? SUPPORTED_LANGUAGES[0]
    );
  });

  readonly isRtl = computed<boolean>(() => this.currentLang() === 'ar');
  readonly dir = computed<'ltr' | 'rtl'>(() => (this.isRtl() ? 'rtl' : 'ltr'));
  readonly supportedLanguages = SUPPORTED_LANGUAGES;

  constructor() {
    this.init();
  }

  private init(): void {
    if (!this.isBrowser) return;

    let initialLang = DEFAULT_LANGUAGE;
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLang | null;
      if (stored && this.isSupported(stored)) {
        initialLang = stored;
      } else if (navigator?.language) {
        const browserCode = navigator.language.slice(0, 2).toLowerCase() as SupportedLang;
        if (this.isSupported(browserCode)) {
          initialLang = browserCode;
        }
      }
    } catch {
      // Ignore storage access errors (e.g., sandbox or private mode)
    }

    this.setLanguage(initialLang);
  }

  isSupported(code: string): code is SupportedLang {
    return SUPPORTED_LANGUAGES.some((l) => l.code === code);
  }

  setLanguage(lang: SupportedLang): void {
    if (!this.isSupported(lang)) return;

    this.currentLang.set(lang);

    if (this.isBrowser) {
      try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      } catch {
        // Ignore storage write errors
      }

      const dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.setAttribute('dir', dir);
      document.documentElement.setAttribute('lang', lang);
    }
  }

  translate(key: string, params?: Record<string, string | number>): string {
    if (!key) return '';

    const lang = this.currentLang();
    let value = this.resolveKey(LOCALES[lang], key);

    // Fallback to default language (French) if missing
    if (value === undefined && lang !== DEFAULT_LANGUAGE) {
      value = this.resolveKey(LOCALES[DEFAULT_LANGUAGE], key);
    }

    // Fallback to the key itself if still not found
    if (value === undefined) {
      return key;
    }

    if (typeof value !== 'string') {
      return String(value);
    }

    // Interpolate {param} placeholders
    if (params) {
      return Object.entries(params).reduce((str, [k, v]) => {
        return str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }, value);
    }

    return value;
  }

  private resolveKey(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return current;
  }
}
