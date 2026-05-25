import { runeIconUrl } from '../champ-select-utils'

import { secondaryRuneGridStyles } from './secondary-rune-grid-styles'

import type { SecondaryRuneGridProps } from './secondary-rune-grid-types'

export function SecondaryRuneGrid({ secondaryTree, selectedPerkIds, onSelectRune }: SecondaryRuneGridProps) {
  const styles = secondaryRuneGridStyles()

  return (
    <div className={styles.container()}>
      {secondaryTree.slots.slice(1).map((slot) => {
        const slotKey = slot.runes.map((rune) => {
          return rune.id
        }).join('-')

        return (
          <div className={styles.row()} key={slotKey}>
            {slot.runes.map((rune) => {
              const isSelected = selectedPerkIds[4] === rune.id || selectedPerkIds[5] === rune.id
              const runeStyles = secondaryRuneGridStyles({ selected: isSelected })

              return (
                <button
                  className={runeStyles.runeItem()}
                  key={rune.id}
                  onClick={() => {
                    return onSelectRune(rune.id)
                  }}
                  title={rune.name}
                  type='button'
                >
                  <img
                    alt={rune.name}
                    className={runeStyles.runeIcon()}
                    loading='lazy'
                    src={runeIconUrl(rune.icon) ?? undefined}
                  />
                </button>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
