import en from '../i18n/en.json'
import es from '../i18n/es.json'

import type { Translations } from './use-i18n-types'

export const translations: Record<string, Translations> = { en, es }

export const APP_NAME = en['app.name']

export const STORAGE_KEY = 'conduit-language'

export function getInitialLanguage(): string {
  const stored = localStorage.getItem(STORAGE_KEY)

  if (stored && stored in translations) {
    return stored
  }

  const browserLang = navigator.language.split('-')[0].toLowerCase()

  return browserLang in translations ? browserLang : 'en'
}
