import { communityDragonGameDataUrl } from '@/core/http/ddragon'

import type { ClashTeam } from '../social-types'
import type { LcuConversation } from '@/core/lcu/parsers'
import type { ClashChatRoster } from '@/core/lcu/parsers/clash-types'

// The Clash teams with a group chat, as the client's social panel lists them: each roster with the conversation whose
// Id carries its multiUserChatId. A conversation whose roster is gone has no name, and the client leaves it
export function readClashTeams(conversations: LcuConversation[], rosters: ClashChatRoster[]): ClashTeam[] {
  return conversations.flatMap((conversation): ClashTeam[] => {
    const roster = rosters.find((candidate) => {
      return conversation.id.includes(candidate.multiUserChatId)
    })

    if (conversation.type !== 'clash' || !roster) {
      return []
    }

    return [
      {
        conversationId: conversation.id,
        logoUrl: roster.isRegistered ? clashLogoUrl(roster) : undefined,
        // The client shows them uppercase
        name: roster.isRegistered ? roster.name.toUpperCase() : null,
        shortName: roster.shortName.toUpperCase(),
      },
    ]
  })
}

// "TAG · NAME", as the client's roster entry pairs them
export function clashTeamTitle(team: ClashTeam, pendingLabel: string): string {
  return team.name === null ? pendingLabel : `${team.shortName} · ${team.name}`
}

// The roster logo in the client's generic assets ("clash-logos"), whose color is 1 when the roster has none
function clashLogoUrl(roster: ClashChatRoster): string | undefined {
  return roster.iconId === undefined
    ? undefined
    : communityDragonGameDataUrl(
        `/lol-game-data/assets/ASSETS/Clash/roster-logos/${roster.iconId}/${roster.iconColorId ?? 1}.png`,
      )
}
