import { runeIconUrl } from '../champ-select-utils'
import { runeButtonBase, runeButtonSelected, runeButtonUnselected } from './rune-editor-styles'
import type { PrimaryRuneGridProps } from './primary-rune-grid-types'

export function PrimaryRuneGrid({ primaryTree, selectedPerkIds, onSelectRune }: PrimaryRuneGridProps) {
  return (
    <div className='border-border bg-secondary/60 space-y-4 rounded-lg border p-4'>
      {primaryTree.slots.map((slot, slotIndex) => (
        <div className='flex justify-center gap-x-4' key={slotIndex}>
          {slot.runes.map((rune) => {
            const isSelected = selectedPerkIds[slotIndex] === rune.id
            return (
              <button
                className={`${runeButtonBase} ${isSelected ? runeButtonSelected : runeButtonUnselected} ${slotIndex === 0 ? 'h-16 w-16' : 'h-12 w-12'}`}
                key={rune.id}
                onClick={() => onSelectRune(slotIndex, rune.id)}
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
