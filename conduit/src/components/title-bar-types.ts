import type { TranslationKey } from '../app-utils'

export interface TitleBarProps {
  onToggleSettings: () => void
  t: (key: TranslationKey) => string
}
