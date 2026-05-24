import type { LanguageCode } from './i18n-types'

export const supportedLanguages: LanguageCode[] = ['en', 'es']

export const isBrowser = typeof navigator !== 'undefined'

export const resolveLanguage = (): LanguageCode => {
  if (!isBrowser) {
    return 'en'
  }

  const browserLanguage = typeof navigator.language === 'string' ? navigator.language.toLowerCase() : 'en'
  return browserLanguage.startsWith('es') ? 'es' : 'en'
}
