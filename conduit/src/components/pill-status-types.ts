import type { TranslationKey } from '../app-utils'

export interface PillStatusProps {
  label: string
  status: 'waiting' | 'connecting' | 'connected' | 'paired'
  hasError: boolean
  t: (key: TranslationKey) => string
}
