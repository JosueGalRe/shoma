import { Crown, Swords } from 'lucide-react'
import { SummonerId } from '@/core/types/branded'
import type { LobbyMember } from '@/features/lobby/lobby-store'

interface VariantBProps {
  members: LobbyMember[]
  queueStatus: { isSearching: boolean }
  canJoinQueue: boolean
  onJoinQueue: () => void
  onLeaveQueue: () => void
  isConnected: boolean
  isActionPending: boolean
}

function MemberRuneIcon({ role }: { role: string }) {
  const roleMap: Record<string, string> = {
    TOP: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-top.png',
    JUNGLE: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-jungle.png',
    MIDDLE: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-middle.png',
    BOTTOM: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-bottom.png',
    UTILITY: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-utility.png',
    FILL: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-fill.png',
  }

  const url = roleMap[role]
  if (!url) return null

  return (
    <img
      alt={role}
      className="size-5 rounded-full border border-[rgba(200,170,110,0.3)] bg-[rgba(10,20,40,0.8)]"
      src={url}
    />
  )
}

const MOCK_MEMBERS: LobbyMember[] = [
  {
    summonerId: SummonerId(2),
    displayName: 'Lustyyog',
    iconUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/3791.jpg',
    isLeader: false,
    isLocalMember: false,
    allowedInviteOthers: false,
    profileIconId: null,
    firstPositionPreference: 'JUNGLE',
    secondPositionPreference: 'UNSELECTED',
    showClimbIndicator: false,
  },
  {
    summonerId: SummonerId(3),
    displayName: 'chimpenzee',
    iconUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/3150.jpg',
    isLeader: false,
    isLocalMember: false,
    allowedInviteOthers: false,
    profileIconId: null,
    firstPositionPreference: 'MIDDLE',
    secondPositionPreference: 'BOTTOM',
    showClimbIndicator: false,
  },
  {
    summonerId: SummonerId(4),
    displayName: '1 and Only Waifu',
    iconUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/3456.jpg',
    isLeader: false,
    isLocalMember: false,
    allowedInviteOthers: false,
    profileIconId: null,
    firstPositionPreference: 'TOP',
    secondPositionPreference: 'UNSELECTED',
    showClimbIndicator: false,
  },
  {
    summonerId: SummonerId(5),
    displayName: 'Imaokai',
    iconUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/3023.jpg',
    isLeader: false,
    isLocalMember: false,
    allowedInviteOthers: false,
    profileIconId: null,
    firstPositionPreference: 'UTILITY',
    secondPositionPreference: 'FILL',
    showClimbIndicator: false,
  },
]

export function VariantB({
  members,
  queueStatus,
  canJoinQueue,
  onJoinQueue,
  onLeaveQueue,
}: VariantBProps) {
  const owner = members.find((m) => m.isLeader) ?? members[0]
  const others = members.filter((m) => m.summonerId !== owner?.summonerId)
  const displayOthers = others.length >= 4 ? others.slice(0, 4) : [...others, ...MOCK_MEMBERS].slice(0, 4)
  const isSearching = queueStatus.isSearching

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[rgb(10,20,40)] gap-4 px-4 py-4">
      {owner && (
        <section className="shrink-0 rounded-2xl border border-[rgba(200,170,110,0.4)] bg-gradient-to-r from-[rgba(200,170,110,0.15)] to-[rgba(10,20,40,0.8)] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-2 border-[rgba(200,170,110,0.7)] shadow-[0_0_20px_rgba(200,170,110,0.3)] overflow-hidden">
                <img alt={owner.displayName} className="h-full w-full object-cover" src={owner.iconUrl ?? undefined} />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(10,20,40,0.95)] border border-[rgba(200,170,110,0.6)] shadow-[0_0_10px_rgba(200,170,110,0.3)]">
                <Crown className="size-3.5 text-[rgb(200,170,110)]" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-[rgb(200,170,110)] truncate tracking-wide">{owner.displayName}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                {owner.firstPositionPreference !== 'UNSELECTED' && (
                  <MemberRuneIcon role={owner.firstPositionPreference} />
                )}
                {owner.secondPositionPreference !== 'UNSELECTED' && owner.firstPositionPreference !== 'FILL' && (
                  <MemberRuneIcon role={owner.secondPositionPreference} />
                )}
              </div>
            </div>
            <Swords className="size-6 text-[rgba(200,170,110,0.5)]" />
          </div>
        </section>
      )}

      <section className="shrink-0 space-y-3">
        {displayOthers.map((member) => (
          <div
            key={member.summonerId}
            className="flex items-center gap-4 rounded-xl border border-[rgba(200,170,110,0.2)] bg-[rgba(10,20,40,0.6)] p-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.3)] transition-colors hover:border-[rgba(200,170,110,0.3)] hover:bg-[rgba(10,20,40,0.8)]"
          >
            <div className="h-12 w-12 rounded-full border border-[rgba(200,170,110,0.4)] overflow-hidden shrink-0">
              <img alt={member.displayName} className="h-full w-full object-cover" src={member.iconUrl ?? undefined} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[rgb(200,170,110)] truncate">{member.displayName}</p>
              <div className="flex items-center gap-1.5 mt-1">
                {member.firstPositionPreference !== 'UNSELECTED' && (
                  <MemberRuneIcon role={member.firstPositionPreference} />
                )}
                {member.secondPositionPreference !== 'UNSELECTED' && member.firstPositionPreference !== 'FILL' && (
                  <MemberRuneIcon role={member.secondPositionPreference} />
                )}
              </div>
            </div>
          </div>
        ))}
      </section>

      <div className="flex-1" />

      <section className="shrink-0 pb-4">
        <div className="flex items-center gap-3 rounded-2xl border border-[rgba(200,170,110,0.3)] bg-[rgba(10,20,40,0.8)] p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.4)] backdrop-blur-sm">
          <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${isSearching ? 'bg-[rgb(200,170,110)] animate-pulse shadow-[0_0_8px_rgb(200,170,110)]' : 'bg-[rgba(200,170,110,0.3)]'}`} />
          <span className="text-xs font-bold uppercase tracking-widest text-[rgba(200,170,110,0.9)] flex-1">
            {isSearching ? 'Searching...' : 'Not in queue'}
          </span>
          <button
            type="button"
            disabled={!canJoinQueue}
            onClick={onJoinQueue}
            className={`rounded-full border px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${
              isSearching
                ? 'border-[rgba(200,170,110,0.3)] bg-[rgba(10,20,40,0.6)] text-[rgba(200,170,110,0.5)]'
                : 'border-[rgba(200,170,110,0.6)] bg-gradient-to-r from-[rgba(200,170,110,0.2)] to-[rgba(200,170,110,0.05)] text-[rgb(200,170,110)] hover:from-[rgba(200,170,110,0.3)] hover:to-[rgba(200,170,110,0.1)] hover:shadow-[0_0_20px_rgba(200,170,110,0.25)]'
            }`}
          >
            Find Match
          </button>
          <button
            type="button"
            onClick={onLeaveQueue}
            disabled={!isSearching}
            className="rounded-full border border-[rgba(200,170,110,0.4)] bg-[rgba(10,20,40,0.8)] px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-[rgba(200,170,110,0.6)] transition-all hover:border-[rgba(200,170,110,0.6)] hover:bg-[rgba(200,170,110,0.1)] hover:text-[rgba(200,170,110,0.9)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Leave
          </button>
        </div>
      </section>
    </div>
  )
}
