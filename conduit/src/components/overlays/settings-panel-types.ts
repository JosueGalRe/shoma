import type { TranslationKey } from '../../hooks/use-i18n'

export interface SettingsPanelProps {
  onClose: () => void
  onCheckUpdate: () => void
  isCheckingUpdate: boolean
  t: (key: TranslationKey) => string
  language: string
  setLanguage: (lang: string) => void
}
