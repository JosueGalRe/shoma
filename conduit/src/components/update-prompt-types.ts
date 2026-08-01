import type { TranslationKey } from '../app-utils'

export interface UpdatePromptProps {
  version: string
  date?: string
  notes?: string
  onDismiss: () => void
  t: (key: TranslationKey, params?: Record<string, string>) => string
}
