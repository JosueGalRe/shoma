import { type RuneTree } from '@/core/http/ddragon-client'
import { type RuneId as RuneIdType } from '@/core/types/branded'

import { runeIconUrl } from '../utils'

interface SecondaryRuneGridProps {
  secondaryTree: RuneTree
  selectedPerkIds: RuneIdType[]
  onSelectRune: (runeId: RuneIdType) => void
}

export function SecondaryRuneGrid({ secondaryTree, selectedPerkIds, onSelectRune }: SecondaryRuneGridProps) {
  return (
    <div className='border-border bg-secondary/60 space-y-4 rounded-lg border p-4'>
      {secondaryTree.slots.slice(1).map((slot, slotIndex) => (
        <div className='flex justify-center gap-x-4' key={slotIndex}>
          {slot.runes.map((rune) => {
            const isSelected = selectedPerkIds[4] === rune.id || selectedPerkIds[5] === rune.id
            return (
              <button
                className={`focus-visible:ring-ring h-12 w-12 rounded-full transition-all focus-visible:ring-2 focus-visible:outline-none ${
                  isSelected
                    ? 'ring-ring scale-110 shadow-[0_0_20px_var(--shoma-primary)] ring-2'
                    : 'hover:ring-ring/60 opacity-50 hover:opacity-100 hover:ring-1'
                }`}
                key={rune.id}
                onClick={() => onSelectRune(rune.id)}
                title={rune.name}
              >
                <img alt={rune.name} className='h-full w-full' loading='lazy' src={runeIconUrl(rune.icon) ?? undefined} />
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
