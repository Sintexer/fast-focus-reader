import { en } from './translations/en';
import { ru } from './translations/ru';
import type { Locale, Translations, TranslationKey } from './types';

export const translations: Translations = {
  en,
  ru,
};

export type { Locale, TranslationKey };

// Helper function to interpolate placeholders in translation strings
export function interpolate(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return values[key]?.toString() ?? match;
  });
}
