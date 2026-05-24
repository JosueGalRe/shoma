import { iconGridSelectorStyles } from './icon-grid-selector-styles'
import type { IconGridSelectorItemProps } from './icon-grid-selector-types'

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
