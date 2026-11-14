import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ko, TranslationKey } from '../locales/ko';
import { en } from '../locales/en';

export type Language = 'ko' | 'en';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const dictionaries: Record<Language, Record<TranslationKey, string>> = {
  ko,
  en,
};

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

const STORAGE_KEY = 'stadium_lang';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ko' || saved === 'en') {
        return saved;
      }
    } catch {
      // Ignore localStorage read errors
    }
    return 'ko';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Ignore localStorage write errors
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'ko' ? 'en' : 'ko');
  }, [language, setLanguage]);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      const dict = dictionaries[language] || dictionaries.ko;
      let text = dict[key] || dictionaries.ko[key] || key;

      if (params) {
        Object.entries(params).forEach(([paramKey, val]) => {
          text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
        });
      }
      return text;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextProps => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

