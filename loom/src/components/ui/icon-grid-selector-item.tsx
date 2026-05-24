import { iconGridSelectorStyles } from './icon-grid-selector-styles'
import type { IconGridSelectorItem as IconGridSelectorItemType } from './icon-grid-selector-types'

interface IconGridSelectorItemProps<T> {
  item: IconGridSelectorItemType<T>
  selected: boolean
  onSelect: (id: T) => void
}

export function IconGridSelectorItem<T>({ item, selected, onSelect }: IconGridSelectorItemProps<T>) {
  const styles = iconGridSelectorStyles({ selected, disabled: item.disabled })

  return (
    <button
      type='button'
      disabled={item.disabled}
      onClick={() => {
        if (!item.disabled) {
          onSelect(item.id)
        }
      }}
      className={styles.item()}
    >
      <img alt={item.name} className={styles.icon()} loading='lazy' src={item.iconUrl} />
      <span className={styles.label()}>{item.name}</span>
    </button>
  )
}
