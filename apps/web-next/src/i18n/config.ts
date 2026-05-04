import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './translations/en'
import es from './translations/es'

const isBrowser = typeof navigator !== 'undefined'

const resolvedLanguage = (() => {
  if (!isBrowser) {
    return 'en'
  }

  const browserLanguage = typeof navigator.language === 'string' ? navigator.language.toLowerCase() : 'en'
  return browserLanguage.startsWith('es') ? 'es' : 'en'
})()

void i18next.use(initReactI18next).init({
  resources: {
    en: {
      translation: en,
    },
    es: {
      translation: es,
    },
  },
  lng: resolvedLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  supportedLngs: ['en', 'es'],
  load: 'languageOnly',
})

export const i18n = i18next
