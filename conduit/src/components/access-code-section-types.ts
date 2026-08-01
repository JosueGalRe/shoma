import type { TranslationKey } from '../app-utils'

export interface AccessCodeSectionProps {
  accessCode: string | null
  isGeneratingCode: boolean
  copied: boolean
  url: string | null
  webUrl: string | null
  t: (key: TranslationKey) => string
  onCopyCode: () => void
}
