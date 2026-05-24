import { runeIconUrl } from '../utils'
import { type PrimaryTreeSelectorProps } from './rune-tree-selector-types'

export function PrimaryTreeSelector({ runeTrees, selectedTreeId, onSelectTree }: PrimaryTreeSelectorProps) {
  return (
    <div className='flex gap-x-2'>
      {runeTrees.map((tree) => (
        <button
          className={`bg-background focus-visible:ring-ring h-12 w-12 rounded-full border-2 p-1 transition-all focus-visible:ring-2 focus-visible:outline-none ${
            tree.id === selectedTreeId
              ? 'border-primary shadow-[0_0_20px_var(--shoma-primary)]'
              : 'hover:border-primary/50 border-transparent opacity-50 hover:opacity-100'
          }`}
          key={tree.id}
          onClick={() => onSelectTree(tree.id)}
        >
          <img alt={tree.name} className='h-full w-full' loading='lazy' src={runeIconUrl(tree.icon) ?? undefined} />
        </button>
      ))}
    </div>
  )
}
