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
    <div className="space-y-4 rounded-lg border border-lol-border-subtle bg-lol-navy-900/60 p-4">
      {secondaryTree.slots.slice(1).map((slot, slotIndex) => (
        <div className="flex justify-center gap-x-4" key={slotIndex}>
          {slot.runes.map((rune) => {
            const isSelected = selectedPerkIds[4] === rune.id || selectedPerkIds[5] === rune.id
            return (
              <button
                className={`h-12 w-12 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold ${
                  isSelected ? 'scale-110 ring-2 ring-lol-border-gold shadow-lol-glow-gold' : 'opacity-50 hover:opacity-100 hover:ring-1 hover:ring-lol-border-gold/60'
                }`}
                key={rune.id}
                onClick={() => onSelectRune(rune.id)}
                title={rune.name}
              >
                <img alt={rune.name} className="h-full w-full" loading="lazy" src={runeIconUrl(rune.icon) ?? undefined} />
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
