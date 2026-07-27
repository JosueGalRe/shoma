import { UsersRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Avatar } from '@/components/ui'

import { conversationsListStyles, socialUnreadBadgeStyles } from '../social-styles'

import { profileIconUrl } from './social-utils'

import type { ConversationsListProps } from '../social-types'

export function ConversationsList({ conversations, handleSelectConversation, ddragonVersion }: ConversationsListProps) {
  const styles = conversationsListStyles()
  const { t } = useTranslation()

  if (conversations.length === 0) {
    return (
      <div className={styles.emptyState()}>
        <div className={styles.emptyTitle()}>{t('social.conversations.emptyTitle')}</div>

        <p className={styles.emptyText()}>{t('social.conversations.emptyText')}</p>
      </div>
    )
  }

  return (
    <div className={styles.root()}>
      {conversations.map((conversation) => {
        return (
          <button
            key={conversation.id}
            type="button"
            onClick={() => {
              return handleSelectConversation(conversation)
            }}
            className={styles.conversationButton()}
          >
            {conversation.friend ? (
              <Avatar
                src={profileIconUrl(ddragonVersion, conversation.friend.iconId)}
                alt={conversation.title}
                status={conversation.friend.status}
                size="sm"
              />
            ) : (
              <span className={styles.groupIcon()}>
                <UsersRound className="size-4" aria-hidden="true" />
              </span>
            )}

            <span className={styles.conversationInfo()}>
              <span className={styles.conversationTitle()}>{conversation.title}</span>

              {conversation.lastMessage ? (
                <span className={styles.conversationPreview()}>{conversation.lastMessage}</span>
              ) : null}
            </span>

            {conversation.unreadCount > 0 ? (
              <span
                aria-label={t('social.unreadMessages', { count: conversation.unreadCount })}
                className={socialUnreadBadgeStyles()}
              >
                {conversation.unreadCount}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
