import { Icon } from '@shoma/ui/icon'
import { IconButton } from '@shoma/ui/icon-button'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { Logo } from '@/components/logo'
import { uiStoreSelectors, useUiStore } from '@/core/state/ui-store'
import { useSocialDocked } from '@/features/social/hooks/use-social-docked'
import { useUnreadChats } from '@/features/social/hooks/use-unread-chats'

import type { TopBarProps } from './top-bar-types'

// Figma "Title" and "Top Nav": back arrow or logo on the left, the chat button that opens Social on the right, unless
// Social is already open beside the screen
export function TopBar({ backDisabled = false, onBack }: TopBarProps) {
  const { t } = useTranslation()
  const setSocialOpen = useUiStore(uiStoreSelectors.setSocialOpen)
  const unread = useUnreadChats().total
  const docked = useSocialDocked()

  return (
    <header {...props(styles.bar)}>
      {onBack ? (
        <IconButton aria-label={t('common.back')} disabled={backDisabled} onClick={onBack}>
          <Icon name="arrow-left" />
        </IconButton>
      ) : (
        <Logo size="small" />
      )}

      {/* Figma's Filled chat button while messages wait, as the client's pulses */}
      {docked ? null : (
        <IconButton
          aria-haspopup="dialog"
          aria-label={unread > 0 ? t('social.openUnread', { count: unread }) : t('social.open')}
          size={onBack ? 'medium' : 'small'}
          variant={unread > 0 ? 'filled' : 'default'}
          onClick={() => {
            setSocialOpen(true)
          }}
        >
          <Icon name={unread > 0 ? 'chat-filled' : 'chat'} />
        </IconButton>
      )}
    </header>
  )
}

const styles = create({
  bar: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'space-between',
    paddingBlock: 16,
    paddingInline: 24,
  },
})
