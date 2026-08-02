import { Plus } from 'lucide-react'

import { lobbyStyles } from '../-styles'

import { LobbyMemberCard } from './lobby-member-card'

import type { LobbyMembersGridProps } from './lobby-members-grid-types'

export function LobbyMembersGrid({
  members,
  isSearching,
  showSecondaryRole,
  canInvite,
  invitesCount,
  onOpenInvites,
  t,
}: LobbyMembersGridProps) {
  return (
    <section className="shrink-0 px-4 py-2">
      <div className="grid grid-cols-2 gap-3">
        {members.map((member) => {
          return (
            <div
              key={member.summonerId}
              className={`${lobbyStyles.memberCardContainer} ${isSearching ? lobbyStyles.memberCardSearching : ''}`}
            >
              <LobbyMemberCard member={member} showSecondaryRole={showSecondaryRole} />
            </div>
          )
        })}
      </div>

      {canInvite ? (
        <button className={lobbyStyles.inviteButton} onClick={onOpenInvites} type="button">
          <div className="relative">
            <Plus className="size-6" />

            {invitesCount > 0 ? <span className={lobbyStyles.inviteBadge}>{invitesCount}</span> : null}
          </div>

          <span className="text-sm font-medium">{t('lobby.bottomNav.invites')}</span>
        </button>
      ) : null}
    </section>
  )
}
