import { type RuneTree } from '@/core/http/ddragon-client'
import { type RuneId as RuneIdType } from '@/core/types/branded'

import { runeIconUrl } from '../utils'

interface PrimaryTreeSelectorProps {
  runeTrees: RuneTree[]
  selectedTreeId: RuneIdType
  onSelectTree: (treeId: RuneIdType) => void
}

export function PrimaryTreeSelector({ runeTrees, selectedTreeId, onSelectTree }: PrimaryTreeSelectorProps) {
  return (
    <div className="flex gap-x-2">
      {runeTrees.map((tree) => (
        <button
          className={`h-12 w-12 rounded-full border-2 bg-background p-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            tree.id === selectedTreeId ? 'border-primary shadow-[0_0_20px_var(--shoma-primary)]' : 'border-transparent opacity-50 hover:border-primary/50 hover:opacity-100'
          }`}
          key={tree.id}
          onClick={() => onSelectTree(tree.id)}
        >
          <img alt={tree.name} className="h-full w-full" loading="lazy" src={runeIconUrl(tree.icon) ?? undefined} />
        </button>
      ))}
    </div>
  )
}

interface SecondaryTreeSelectorProps {
  runeTrees: RuneTree[]
  primaryTreeId: RuneIdType
  selectedTreeId: RuneIdType
  onSelectTree: (treeId: RuneIdType) => void
}

export function SecondaryTreeSelector({ runeTrees, primaryTreeId, selectedTreeId, onSelectTree }: SecondaryTreeSelectorProps) {
  return (
    <div className="flex gap-x-2">
      {runeTrees.map((tree) => {
        if (tree.id === primaryTreeId) return null
        return (
          <button
            className={`h-10 w-10 rounded-full border-2 bg-background p-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              tree.id === selectedTreeId ? 'border-primary shadow-[0_0_20px_var(--shoma-primary)]' : 'border-transparent opacity-50 hover:border-primary/50 hover:opacity-100'
            }`}
            key={tree.id}
            onClick={() => onSelectTree(tree.id)}
          >
            <img alt={tree.name} className="h-full w-full" loading="lazy" src={runeIconUrl(tree.icon) ?? undefined} />
          </button>
        )
      })}
    </div>
  )
}
