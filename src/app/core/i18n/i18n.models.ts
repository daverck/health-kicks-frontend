export type SupportedLang = 'fr' | 'en' | 'nl' | 'es' | 'zh' | 'ar' | 'de';

export interface LanguageMeta {
  code: SupportedLang;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'en', name: 'Anglais', nativeName: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'nl', name: 'Néerlandais', nativeName: 'Nederlands', flag: '🇳🇱', dir: 'ltr' },
  { code: 'es', name: 'Espagnol', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'zh', name: 'Chinois', nativeName: '中文', flag: '🇨🇳', dir: 'ltr' },
  { code: 'ar', name: 'Arabe', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'de', name: 'Allemand', nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
];

export const DEFAULT_LANGUAGE: SupportedLang = 'fr';
export const LANGUAGE_STORAGE_KEY = 'healthkicks_lang';

export type TranslationDictionary = Record<string, any>;
