'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { dictionaries, type Locale } from './dictionaries';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('lang') as Locale | null;
    if (stored && (stored === 'en' || stored === 'th')) {
      setLocaleState(stored);
    }
    setMounted(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('lang', newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  const t = useCallback(
    (key: string): string => {
      // key format: "section.key" e.g. "home.heroTitle"
      const [section, ...rest] = key.split('.');
      const k = rest.join('.');
      return dictionaries[locale]?.[section]?.[k] ?? key;
    },
    [locale],
  );

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    // Fallback for when context is not available (e.g. during SSR before mount)
    return {
      locale: 'en' as Locale,
      setLocale: () => {},
      t: (key: string) => {
        const [section, ...rest] = key.split('.');
        const k = rest.join('.');
        return dictionaries.en?.[section]?.[k] ?? key;
      },
    };
  }
  return context;
}
