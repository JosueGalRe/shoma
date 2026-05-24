import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import { resolveLanguage, supportedLanguages } from './config-utils'
import en from './translations/en'
import es from './translations/es'

void i18next.use(initReactI18next).init({
  resources: {
    en: {
      translation: en,
    },
    es: {
      translation: es,
    },
  },
  lng: resolveLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  supportedLngs: supportedLanguages,
  load: 'languageOnly',
})

export const i18n = i18next
