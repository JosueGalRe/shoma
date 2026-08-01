import { useState } from 'react'

import { getInitialLanguage, STORAGE_KEY, translations } from './use-i18n-utils'

import type { TranslationKey } from './use-i18n-types'

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
