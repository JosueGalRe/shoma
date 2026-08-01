import type { TranslationKey } from '../hooks/use-i18n'

export interface TitleBarProps {
  onToggleSettings: () => void
  t: (key: TranslationKey) => string
}
