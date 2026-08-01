import type en from '../i18n/en.json'

export type TranslationKey = keyof typeof en

export type Translations = Record<TranslationKey, string>
