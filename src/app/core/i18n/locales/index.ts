import { SupportedLang, TranslationDictionary } from '../i18n.models';
import { fr } from './fr';
import { en } from './en';
import { nl } from './nl';
import { es } from './es';
import { zh } from './zh';
import { ar } from './ar';
import { de } from './de';

export const LOCALES: Record<SupportedLang, TranslationDictionary> = {
  fr,
  en,
  nl,
  es,
  zh,
  ar,
  de,
};

export { fr, en, nl, es, zh, ar, de };
