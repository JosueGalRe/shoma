import { MessageSquare, UsersRound } from 'lucide-react'

import { socialTabBarStyles, socialTabButtonStyles, socialTabIconStyles } from '../social-styles'

import type { SocialTabBarProps } from '../social-types'

export function SocialTabBar({ activeTab, setActiveTab }: SocialTabBarProps) {
  const styles = socialTabBarStyles()

  return (
    <div className={styles.root()} role='tablist' aria-label='Social sections'>
      <button
        type='button'
        role='tab'
        aria-selected={activeTab === 'friends'}
        onClick={() => {
          return setActiveTab('friends')
        }}
        className={socialTabButtonStyles({ active: activeTab === 'friends' })}
      >
        <UsersRound className={socialTabIconStyles()} aria-hidden='true' />
        Friends
      </button>

      <button
        type='button'
        role='tab'
        aria-selected={activeTab === 'chat'}
        onClick={() => {
          return setActiveTab('chat')
        }}
        className={socialTabButtonStyles({ active: activeTab === 'chat' })}
      >
        <MessageSquare className={socialTabIconStyles()} aria-hidden='true' />
        Chat
      </button>
    </div>
  )
}
