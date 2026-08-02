import { ArrowLeft, UsersRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Avatar } from '@/components/ui'

import { useTranslatedStatusLabels } from '../hooks/use-social-labels'
import { socialStatusDotStyles } from '../social-styles'

import { profileIconUrl } from './friend-utils'

import type { ChatPanelHeaderProps } from './chat-panel-header-types'

export function ChatPanelHeader({ selectedFriend, conversationTitle, ddragonVersion, onBack, styles }: ChatPanelHeaderProps) {
  const statusLabels = useTranslatedStatusLabels()
  const { t } = useTranslation()

  const backButton = onBack ? (
    <button type="button" aria-label={t('social.conversations.back')} onClick={onBack} className={styles.headerBackButton()}>
      <ArrowLeft className="size-4" aria-hidden="true" />
    </button>
  ) : null

  if (!selectedFriend) {
    return (
      <div className={styles.header()}>
        <div className="flex items-center gap-2">
          {backButton}

          {conversationTitle ? (
            <div className="flex items-center gap-3">
              <span className={styles.headerGroupIcon()}>
                <UsersRound className="size-4" aria-hidden="true" />
              </span>

              <div className={styles.headerTitle()}>{conversationTitle}</div>
            </div>
          ) : (
            <div className={styles.headerEmpty()}>Select a friend to start chatting.</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.header()}>
      <div className="flex items-center gap-2">
        {backButton}

        <div className="flex items-center gap-3">
          <Avatar
            src={profileIconUrl(ddragonVersion, selectedFriend.iconId)}
            alt={selectedFriend.name}
            status={selectedFriend.status}
            size="sm"
          />

          <div className="min-w-0">
            <div className={styles.headerTitle()}>{selectedFriend.name}</div>

            <div className={styles.headerStatus()}>
              <span className={socialStatusDotStyles({ status: selectedFriend.status })} />

              {statusLabels[selectedFriend.status]}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
