import { Button } from '@/components/ui/button'

import { runePageControlsStyles } from './rune-page-controls-styles'
import type { RunePageControlsProps } from './rune-page-controls-types'

export function RunePageControls({
  pages,
  currentPageId,
  onSetCurrentPage,
  onCreatePage,
  onDeletePage,
}: RunePageControlsProps) {
  const styles = runePageControlsStyles()

  return (
    <div className={styles.root()}>
      <div className={styles.pages()}>
        {pages.map((p) => {
          const isActive = p.id === currentPageId
          const tabStyles = runePageControlsStyles({ active: isActive })

          return (
            <button
              key={p.id}
              className={tabStyles.tab()}
              onClick={() => {
                return onSetCurrentPage(p.id)
              }}
              type='button'
            >
              {p.name}
            </button>
          )
        })}
      </div>
      <Button onClick={onCreatePage} size='sm' variant='secondary'>
        +
      </Button>
      <Button onClick={onDeletePage} size='sm' variant='destructive'>
        -
      </Button>
    </div>
  )
}
