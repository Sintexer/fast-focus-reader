import type { en } from './translations/en';
import type { ru } from './translations/ru';

export type Locale = 'en' | 'ru';
export type TranslationKey = keyof typeof en;

export interface Translations {
  en: typeof en;
  ru: typeof ru;
}
