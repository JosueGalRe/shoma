import { useState } from 'react'

import en from '../i18n/en.json'
import es from '../i18n/es.json'

export type TranslationKey = keyof typeof en
type Translations = Record<TranslationKey, string>

const translations: Record<string, Translations> = { en, es }

const STORAGE_KEY = 'conduit-language'

const getInitialLanguage = () => {
  const stored = localStorage.getItem(STORAGE_KEY)

  if (stored && stored in translations) {
    return stored
  }

  const browserLang = navigator.language.split('-')[0].toLowerCase()

  return browserLang in translations ? browserLang : 'en'
}

export const useI18n = () => {
  const [language, setLanguage] = useState(getInitialLanguage)
  const dictionary = translations[language] ?? translations.en

  const updateLanguage = (lang: string) => {
    if (lang in translations) {
      localStorage.setItem(STORAGE_KEY, lang)
      setLanguage(lang)
    }
  }

  const t = (key: TranslationKey, params?: Record<string, string>) => {
    let text = dictionary[key] ?? translations.en[key]

    if (params && text) {
      for (const [param, value] of Object.entries(params)) {
        text = text.replace(`{${param}}`, value)
      }
    }

    return text
  }

  return { language, setLanguage: updateLanguage, t }
}

export const APP_NAME = en['app.name']
