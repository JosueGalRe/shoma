import { Icon } from '@shoma/ui/icon'
import { IconButton } from '@shoma/ui/icon-button'
import { useTranslation } from 'react-i18next'

import { uiStoreSelectors, useUiStore } from '@/core/state/ui-store'
import { useSocialDocked } from '@/features/social/hooks/use-social-docked'
import { useUnreadChats } from '@/features/social/hooks/use-unread-chats'

import type { ChatButtonProps } from './chat-button-types'

// The chat button that opens Social, in the Figma's Filled state while messages wait, as the client's pulses. None while
// Social is already open beside the screen
export function ChatButton({ size = 'medium' }: ChatButtonProps) {
  const { t } = useTranslation()
  const setSocialOpen = useUiStore(uiStoreSelectors.setSocialOpen)
  const unread = useUnreadChats().total
  const docked = useSocialDocked()

  if (docked) {
    return null
  }

  return (
    <IconButton
      aria-haspopup="dialog"
      aria-label={unread > 0 ? t('social.openUnread', { count: unread }) : t('social.open')}
      size={size}
      variant={unread > 0 ? 'filled' : 'default'}
      onClick={() => {
        setSocialOpen(true)
      }}
    >
      <Icon name={unread > 0 ? 'chat-filled' : 'chat'} />
    </IconButton>
  )
}
