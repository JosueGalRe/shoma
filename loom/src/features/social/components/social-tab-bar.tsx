import { MessageSquare, UsersRound } from 'lucide-react'

import { cn } from '@/lib/utils'

export type SocialTab = 'friends' | 'chat'

interface SocialTabBarProps {
  activeTab: SocialTab
  setActiveTab: (tab: SocialTab) => void
}

export function SocialTabBar({ activeTab, setActiveTab }: SocialTabBarProps) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2" role="tablist" aria-label="Social sections">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'friends'}
        onClick={() => setActiveTab('friends')}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-sm border px-3 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold',
          activeTab === 'friends'
            ? 'border-lol-border-gold bg-lol-navy-800 text-lol-gold shadow-lol-glow-gold'
            : 'border-lol-border-subtle text-lol-text-secondary hover:text-lol-text-primary'
        )}
      >
        <UsersRound className="size-4" aria-hidden="true" />
        Friends
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'chat'}
        onClick={() => setActiveTab('chat')}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-sm border px-3 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold',
          activeTab === 'chat'
            ? 'border-lol-border-gold bg-lol-navy-800 text-lol-gold shadow-lol-glow-gold'
            : 'border-lol-border-subtle text-lol-text-secondary hover:text-lol-text-primary'
        )}
      >
        <MessageSquare className="size-4" aria-hidden="true" />
        Chat
      </button>
    </div>
  )
}
