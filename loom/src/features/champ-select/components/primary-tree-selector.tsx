import { runeIconUrl } from '../champ-select-utils'

import { primaryTreeSelectorStyles } from './primary-tree-selector-styles'

import type { PrimaryTreeSelectorProps } from './rune-tree-selector-types'

export function PrimaryTreeSelector({ runeTrees, selectedTreeId, onSelectTree }: PrimaryTreeSelectorProps) {
  const styles = primaryTreeSelectorStyles()

  return (
    <div className={styles.root()}>
      {runeTrees.map((tree) => {
        return (
          <button
            className={styles.button({ selected: tree.id === selectedTreeId })}
            key={tree.id}
            onClick={() => {
              return onSelectTree(tree.id)
            }}
            type="button"
          >
            <img alt={tree.name} className={styles.icon()} loading="lazy" src={runeIconUrl(tree.icon) ?? undefined} />
          </button>
        )
      })}
    </div>
  )
}
