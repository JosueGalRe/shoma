import { runeIconUrl } from '../champ-select-utils'
import { secondaryRuneGridStyles } from './secondary-rune-grid-styles'
import type { SecondaryRuneGridProps } from './secondary-rune-grid-types'

export function SecondaryRuneGrid({ secondaryTree, selectedPerkIds, onSelectRune }: SecondaryRuneGridProps) {
  const styles = secondaryRuneGridStyles()

  return (
    <div className={styles.container()}>
      {secondaryTree.slots.slice(1).map((slot, slotIndex) => (
        <div className={styles.row()} key={slotIndex}>
          {slot.runes.map((rune) => {
            const isSelected = selectedPerkIds[4] === rune.id || selectedPerkIds[5] === rune.id
            const runeStyles = secondaryRuneGridStyles({ selected: isSelected })
            return (
              <button
                className={runeStyles.runeItem()}
                key={rune.id}
                onClick={() => onSelectRune(rune.id)}
                title={rune.name}
              >
                <img alt={rune.name} className={runeStyles.runeIcon()} loading='lazy' src={runeIconUrl(rune.icon) ?? undefined} />
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
