import { type RuneTree } from '@/core/http/ddragon-client'
import { type RuneId as RuneIdType } from '@/core/types/branded'

export interface PrimaryTreeSelectorProps {
  runeTrees: RuneTree[]
  selectedTreeId: RuneIdType
  onSelectTree: (treeId: RuneIdType) => void
}

export interface SecondaryTreeSelectorProps {
  runeTrees: RuneTree[]
  primaryTreeId: RuneIdType
  selectedTreeId: RuneIdType
  onSelectTree: (treeId: RuneIdType) => void
}
