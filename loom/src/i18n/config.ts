import { use } from 'i18next'
import { initReactI18next } from 'react-i18next'

import { resolveLanguage, supportedLanguages } from './config-utils'
import en from './translations/en'
import es from './translations/es'

const i18next = use(initReactI18next)

void i18next.init({
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  lng: resolveLanguage(),
  load: 'languageOnly',
  resources: {
    en: {
      translation: en,
    },
    es: {
      translation: es,
    },
  },
  supportedLngs: supportedLanguages,
})

export const i18n = i18next
