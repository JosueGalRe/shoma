import i18next, { use as applyI18nextPlugin, init } from 'i18next'
import { initReactI18next } from 'react-i18next'

import { resolveLanguage, supportedLanguages } from './config-utils'
import en from './translations/en'
import es from './translations/es'

applyI18nextPlugin(initReactI18next)

void init({
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
