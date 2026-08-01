import type { TranslationKey } from '../../hooks/use-i18n-types'

export interface UpdatePromptProps {
  version: string
  date?: string
  notes?: string
  onDismiss: () => void
  t: (key: TranslationKey, params?: Record<string, string>) => string
}
