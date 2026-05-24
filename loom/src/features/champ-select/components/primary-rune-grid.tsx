import { runeIconUrl } from '../champ-select-utils'
import { primaryRuneGridStyles } from './primary-rune-grid-styles'
import type { PrimaryRuneGridProps } from './primary-rune-grid-types'

export function PrimaryRuneGrid({ primaryTree, selectedPerkIds, onSelectRune }: PrimaryRuneGridProps) {
  const styles = primaryRuneGridStyles()

  return (
    <div className={styles.container()}>
      {primaryTree.slots.map((slot, slotIndex) => (
        <div className={styles.row()} key={slotIndex}>
          {slot.runes.map((rune) => {
            const isSelected = selectedPerkIds[slotIndex] === rune.id
            const runeStyles = primaryRuneGridStyles({
              selected: isSelected,
              size: slotIndex === 0 ? 'primary' : 'secondary',
            })
            return (
              <button
                className={runeStyles.runeItem()}
                key={rune.id}
                onClick={() => onSelectRune(slotIndex, rune.id)}
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
