import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import language resources
import enTranslations from '@/locales/en.json';
import deTranslations from '@/locales/de.json';

// Define available language resources
const resources = {
  en: {
    translation: enTranslations
  },
  de: {
    translation: deTranslations
  }
};

// Detect browser language
const detectBrowserLanguage = (): string => {
  const storedLanguage = localStorage.getItem('userLanguage');
  if (storedLanguage) {
    return storedLanguage;
  }
  
  const browserLang = navigator.language;
  // Check if browser language starts with 'de'
  if (browserLang.startsWith('de')) {
    return 'de';
  }
  
  // Default to English
  return 'en';
};

// Initialize i18next
i18n
  .use(initReactI18next) // Pass i18n down to react-i18next
  .init({
    resources,
    lng: detectBrowserLanguage(),
    fallbackLng: 'en', // Fallback language
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
    // Enable namespace separation with dots
    keySeparator: '.',
    // Debugging in development
    debug: import.meta.env.DEV,
  });

export default i18n;

// Export a hook for changing language
export const useLanguage = () => {
  const currentLanguage = i18n.language;
  
  const changeLanguage = (language: 'en' | 'de') => {
    i18n.changeLanguage(language);
    localStorage.setItem('userLanguage', language);
  };
  
  return {
    currentLanguage,
    changeLanguage
  };
};