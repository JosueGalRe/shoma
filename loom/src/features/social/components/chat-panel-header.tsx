import { Avatar } from '@/components/ui'

import { socialStatusDotStyles } from '../social-styles'
import { profileIconUrl, useTranslatedStatusLabels } from './social-utils'
import type { ChatPanelHeaderProps } from './chat-panel-header-types'

export function ChatPanelHeader({ selectedFriend, ddragonVersion, styles }: ChatPanelHeaderProps) {
  const statusLabels = useTranslatedStatusLabels()

  if (!selectedFriend) {
    return (
      <div className={styles.header()}>
        <div className={styles.headerEmpty()}>Select a friend to start chatting.</div>
      </div>
    )
  }

  return (
    <div className={styles.header()}>
      <div className='flex items-center gap-3'>
        <Avatar
          src={profileIconUrl(ddragonVersion, selectedFriend.iconId)}
          alt={selectedFriend.name}
          status={selectedFriend.status}
          size='sm'
        />
        <div className='min-w-0'>
          <div className='text-foreground truncate text-sm font-semibold'>{selectedFriend.name}</div>
          <div className='text-muted mt-1 flex items-center gap-1.5 text-xs'>
            <span className={socialStatusDotStyles({ status: selectedFriend.status })} />
            {statusLabels[selectedFriend.status]}
          </div>
        </div>
      </div>
    </div>
  )
}
