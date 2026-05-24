import type { RuneTree } from '@/core/http/ddragon-client'
import type { RuneId as RuneIdType } from '@/core/types/branded'

import { runeIconUrl } from '../champ-select-utils'
import type { SecondaryRuneGridProps } from './secondary-rune-grid-types'
import { secondaryRuneButtonBase, runeButtonSelected, runeButtonUnselected } from './rune-editor-styles'

export function SecondaryRuneGrid({ secondaryTree, selectedPerkIds, onSelectRune }: SecondaryRuneGridProps) {
  return (
    <div className='border-border bg-secondary/60 space-y-4 rounded-lg border p-4'>
      {secondaryTree.slots.slice(1).map((slot, slotIndex) => (
        <div className='flex justify-center gap-x-4' key={slotIndex}>
          {slot.runes.map((rune) => {
            const isSelected = selectedPerkIds[4] === rune.id || selectedPerkIds[5] === rune.id
            return (
              <button
                className={`${secondaryRuneButtonBase} ${isSelected ? runeButtonSelected : runeButtonUnselected}`}
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
