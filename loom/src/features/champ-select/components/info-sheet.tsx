import { BottomSheet } from '@shoma/ui/bottom-sheet'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import type { InfoSheetProps } from './picker-types'

// A tile's info badge: the spell's or rune's name and what it does, as the client describes it
export function InfoSheet({ body, onOpenChange, open, title }: InfoSheetProps) {
  const { t } = useTranslation()

  return (
    <BottomSheet closeLabel={t('common.back')} open={open} title={title} onOpenChange={onOpenChange}>
      <p {...props(text.body2, styles.body)}>{body}</p>
    </BottomSheet>
  )
}

const styles = create({
  body: {
    color: color.text,
    margin: 0,
    paddingBlockEnd: 16,
    whiteSpace: 'pre-line',
  },
})
