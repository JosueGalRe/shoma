import type { RuneTree } from '@/core/http/ddragon-client'

export interface RuneEditorProps {
  runeTrees: RuneTree[]
  isOpen: boolean
  onClose: () => void
}
