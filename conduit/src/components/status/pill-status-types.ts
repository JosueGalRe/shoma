import type { TranslationKey } from '../../hooks/use-i18n-types'

export interface PillStatusProps {
  label: string
  status: 'waiting' | 'connecting' | 'connected' | 'paired'
  hasError: boolean
  t: (key: TranslationKey) => string
}
