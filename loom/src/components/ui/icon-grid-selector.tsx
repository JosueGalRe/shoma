import { IconGridSelectorItem } from './icon-grid-selector-item'
import { iconGridSelectorStyles } from './icon-grid-selector-styles'
import type { IconGridSelectorProps } from './icon-grid-selector-types'

export function IconGridSelector<T>({ items, selectedId, onSelect, columns = 3 }: IconGridSelectorProps<T>) {
  const styles = iconGridSelectorStyles()

  return (
    <div className={styles.root()} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {items.map((item) => {
        return <IconGridSelectorItem key={String(item.id)} item={item} onSelect={onSelect} selected={selectedId === item.id} />
      })}
    </div>
  )
}
