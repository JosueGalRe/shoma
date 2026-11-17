import { Icon } from '@shoma/ui/icon'
import { IconButton } from '@shoma/ui/icon-button'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { ChatButton } from './chat-button'

import type { TopBarProps } from './top-bar-types'

// Figma "Title" and "Top Nav": the back arrow and the screen's title (the dashboard's is the logo) on the left; on the
// Right the dashboard's gear and the chat button
export function TopBar({ backDisabled = false, onBack, onOpenSettings, title }: TopBarProps) {
  const { t } = useTranslation()

  return (
    <header {...props(styles.bar)}>
      <div {...props(styles.start)}>
        {onBack ? (
          <IconButton aria-label={t('common.back')} disabled={backDisabled} onClick={onBack}>
            <Icon name="arrow-left" />
          </IconButton>
        ) : null}

        {title}
      </div>

      <div {...props(styles.actions)}>
        {onOpenSettings ? (
          <IconButton aria-haspopup="dialog" aria-label={t('settings.open')} size="small" onClick={onOpenSettings}>
            <Icon name="settings" />
          </IconButton>
        ) : null}

        <ChatButton size={onBack ? 'medium' : 'small'} />
      </div>
    </header>
  )
}

const styles = create({
  actions: {
    display: 'flex',
    flexShrink: 0,
    gap: 16,
  },
  bar: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    flexShrink: 0,
    gap: 16,
    justifyContent: 'space-between',
    paddingBlock: 16,
    paddingInline: 24,
  },
  start: {
    alignItems: 'center',
    display: 'flex',
    gap: 8,
    minWidth: 0,
  },
})
