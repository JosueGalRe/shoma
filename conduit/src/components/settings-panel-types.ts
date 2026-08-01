import type { TranslationKey } from '../app-utils'

export interface SettingsPanelProps {
  onClose: () => void
  onCheckUpdate: () => void
  isCheckingUpdate: boolean
  t: (key: TranslationKey) => string
  language: string
  setLanguage: (lang: string) => void
}
