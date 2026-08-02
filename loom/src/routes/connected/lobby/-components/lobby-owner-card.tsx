import { Crown } from 'lucide-react'

import { lobbyStyles } from '../-styles'

import type { LobbyOwnerCardProps } from './lobby-owner-card-types'

export function LobbyOwnerCard({ member, isSearching }: LobbyOwnerCardProps) {
  return (
    <section className="shrink-0 p-4">
      <button className={lobbyStyles.ownerCard} disabled={isSearching} type="button">
        <div className="relative">
          <div className={lobbyStyles.ownerAvatarContainer}>
            <img alt={member.displayName} className="h-full w-full object-cover" src={member.iconUrl ?? undefined} />
          </div>

          {member.isLeader ? (
            <div className={lobbyStyles.ownerCrownIcon}>
              <Crown className="size-3 text-[rgb(200,170,110)]" />
            </div>
          ) : null}
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <span className="text-center text-base font-bold text-[rgb(200,170,110)]">{member.displayName}</span>
        </div>
      </button>
    </section>
  )
}
