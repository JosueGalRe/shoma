import type { TranslationKey } from '../hooks/use-i18n-types'

export interface TitleBarProps {
  onToggleSettings: () => void
  t: (key: TranslationKey) => string
}
