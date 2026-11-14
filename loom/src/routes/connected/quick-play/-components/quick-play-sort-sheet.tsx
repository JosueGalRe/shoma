import { useState } from 'react'

import { BottomSheet } from '@shoma/ui/bottom-sheet'
import { Button } from '@shoma/ui/button'
import { Radio, RadioGroup } from '@shoma/ui/radio-group'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import type { ChampionSort, QuickPlaySortSheetProps } from './quick-play-screen-types'

const SORTS = ['name', 'mastery', 'favorite'] as const satisfies readonly ChampionSort[]

// Figma "Sort by" (159:16771): the client's three champion orders, applied on APPLY. CLEAR goes back to by name
export function QuickPlaySortSheet({ onApply, onOpenChange, open, sort }: QuickPlaySortSheetProps) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(sort)
  const [wasOpen, setWasOpen] = useState(open)

  // Each opening starts on the applied order; resetting on close would move the mark while the sheet slides away
  if (open !== wasOpen) {
    setWasOpen(open)

    if (open) {
      setDraft(sort)
    }
  }

  function apply(next: ChampionSort) {
    onApply(next)
    onOpenChange(false)
  }

  return (
    <BottomSheet
      fullHeight
      closeLabel={t('common.back')}
      footer={
        <div {...props(styles.actions)}>
          <Button
            onClick={() => {
              apply(draft)
            }}
          >
            {t('lobby.quickPlay.apply')}
          </Button>

          <Button
            variant="secondary"
            onClick={() => {
              apply('name')
            }}
          >
            {t('lobby.quickPlay.clear')}
          </Button>
        </div>
      }
      open={open}
      title={t('lobby.quickPlay.sortBy')}
      onOpenChange={onOpenChange}
    >
      <RadioGroup
        aria-label={t('lobby.quickPlay.sortBy')}
        style={styles.list}
        value={draft}
        onValueChange={(value: ChampionSort) => {
          setDraft(value)
        }}
      >
        {SORTS.map((each) => {
          return <Radio key={each} label={t(`lobby.quickPlay.sorts.${each}`)} value={each} />
        })}
      </RadioGroup>
    </BottomSheet>
  )
}

const styles = create({
  // Figma "Bottom Action": APPLY over CLEAR, 10 apart
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  // Figma: 16 between the options, 24 above them
  list: {
    gap: 16,
    paddingBlockStart: 14,
  },
})
