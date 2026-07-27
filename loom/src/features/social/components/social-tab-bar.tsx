import { MessageSquare, UsersRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { socialTabBarStyles, socialTabButtonStyles, socialTabIconStyles, socialUnreadBadgeStyles } from '../social-styles'

import type { SocialTabBarProps } from '../social-types'

export function SocialTabBar({ activeTab, setActiveTab, unreadCount }: SocialTabBarProps) {
  const styles = socialTabBarStyles()
  const { t } = useTranslation()

  return (
    <div className={styles.root()} role="tablist" aria-label="Social sections">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'friends'}
        onClick={() => {
          return setActiveTab('friends')
        }}
        className={socialTabButtonStyles({ active: activeTab === 'friends' })}
      >
        <UsersRound className={socialTabIconStyles()} aria-hidden="true" />
        Friends
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'chat'}
        onClick={() => {
          return setActiveTab('chat')
        }}
        className={socialTabButtonStyles({ active: activeTab === 'chat' })}
      >
        <MessageSquare className={socialTabIconStyles()} aria-hidden="true" />

        <span>Chat</span>

        {unreadCount > 0 ? (
          <span aria-label={t('social.unreadMessages', { count: unreadCount })} className={socialUnreadBadgeStyles()}>
            {unreadCount}
          </span>
        ) : null}
      </button>
    </div>
  )
}
