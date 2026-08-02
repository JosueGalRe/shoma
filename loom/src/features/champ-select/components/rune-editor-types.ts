import type { RuneTree } from '@/core/http/ddragon'

export interface RuneEditorProps {
  runeTrees: RuneTree[]
  isOpen: boolean
  onClose: () => void
}
