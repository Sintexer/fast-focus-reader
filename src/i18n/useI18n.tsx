import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { translations, interpolate, type Locale, type TranslationKey } from './index';
import { getLocale, saveLocale } from '../utils/db';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [isLoading, setIsLoading] = useState(true);

  // Load locale from storage on mount
  useEffect(() => {
    getLocale()
      .then((savedLocale) => {
        if (savedLocale) {
          setLocaleState(savedLocale);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  const setLocale = useCallback(async (newLocale: Locale) => {
    setLocaleState(newLocale);
    await saveLocale(newLocale);
  }, []);

  const t = useCallback(
    (key: TranslationKey, values?: Record<string, string | number>): string => {
      const translation = translations[locale][key];
      if (!translation) {
        console.warn(`Translation missing for key: ${key} in locale: ${locale}`);
        return key;
      }
      if (values) {
        return interpolate(translation, values);
      }
      return translation;
    },
    [locale]
  );

  // Don't render children until locale is loaded
  if (isLoading) {
    return null;
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
