import type { ReactNode } from 'react'

import { BookOpen, Eye } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { draftActionBarStyles } from './draft-action-bar-styles'

export interface DraftActionBarProps {
  actionEnabled: boolean
  actionLabel: string
  onAction: () => void
  onOpenRunes: () => void
  onOpenWard: () => void
  runesLabel: string
  spellsContent?: ReactNode
  wardLabel: string
}

export function DraftActionBar({
  actionEnabled,
  actionLabel,
  onAction,
  onOpenRunes,
  onOpenWard,
  runesLabel,
  spellsContent,
  wardLabel,
}: DraftActionBarProps) {
  const styles = draftActionBarStyles()

  return (
    <div className={styles.root()}>
      <Button className={styles.action()} disabled={!actionEnabled} onClick={onAction} variant="primary">
        <span className="truncate">{actionLabel}</span>
      </Button>

      <div className={styles.loadout()}>
        {spellsContent}

        <Button aria-label={runesLabel} className={styles.loadoutButton()} onClick={onOpenRunes} variant="secondary">
          <BookOpen className={styles.loadoutIcon()} />
        </Button>

        <Button aria-label={wardLabel} className={styles.loadoutButton()} onClick={onOpenWard} variant="secondary">
          <Eye className={styles.loadoutIcon()} />
        </Button>
      </div>
    </div>
  )
}
