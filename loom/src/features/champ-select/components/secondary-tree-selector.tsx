import { runeIconUrl } from '../champ-select-utils'
import type { SecondaryTreeSelectorProps } from './rune-tree-selector-types'
import { secondaryTreeSelectorStyles } from './secondary-tree-selector-styles'

export function SecondaryTreeSelector({ runeTrees, primaryTreeId, selectedTreeId, onSelectTree }: SecondaryTreeSelectorProps) {
  const styles = secondaryTreeSelectorStyles()

  return (
    <div className={styles.root()}>
      {runeTrees.map((tree) => {
        if (tree.id === primaryTreeId) {
          return null
        }
        return (
          <button
            className={styles.button({ selected: tree.id === selectedTreeId })}
            key={tree.id}
            onClick={() => {
              return onSelectTree(tree.id)
            }}
            type='button'
          >
            <img alt={tree.name} className={styles.icon()} loading='lazy' src={runeIconUrl(tree.icon) ?? undefined} />
          </button>
        )
      })}
    </div>
  )
}
