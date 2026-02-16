// Language hook with RTL support and localStorage persistence
import { useState, useEffect, useCallback } from 'react';
import { Language, translations, TranslationKey } from './translations';

const LANG_KEY = 'study-dashboard-lang';

export const useLanguage = () => {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem(LANG_KEY) as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((key: TranslationKey): string => {
    return translations[lang][key] || translations.en[key] || key;
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLang(prev => prev === 'en' ? 'ar' : 'en');
  }, []);

  return { lang, setLang, t, toggleLang, isRTL: lang === 'ar' };
};
