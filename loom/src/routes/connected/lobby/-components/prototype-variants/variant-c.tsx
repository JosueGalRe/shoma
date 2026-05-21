import { Crown } from 'lucide-react'
import { SummonerId } from '@/core/types/branded'
import type { LobbyMember } from '@/features/lobby/lobby-store'

interface VariantCProps {
  members: LobbyMember[]
  queueStatus: { isSearching: boolean }
  canJoinQueue: boolean
  onJoinQueue: () => void
  onLeaveQueue: () => void
  isConnected: boolean
  isActionPending: boolean
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

export function VariantC({
  members,
  queueStatus,
  canJoinQueue,
  onJoinQueue,
  onLeaveQueue,
}: VariantCProps) {
  const owner = members.find((m) => m.isLeader) ?? members[0]
  const others = members.filter((m) => m.summonerId !== owner?.summonerId)
  const displayOthers = others.length >= 4 ? others.slice(0, 4) : [...others, ...MOCK_MEMBERS].slice(0, 4)
  const isSearching = queueStatus.isSearching

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[rgb(10,20,40)] px-4 py-4">
      {owner && (
        <section className="shrink-0 flex flex-col items-center gap-3 py-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-full overflow-hidden border border-[rgba(200,170,110,0.3)] shadow-[0_0_40px_rgba(200,170,110,0.2)]">
              <img alt={owner.displayName} className="h-full w-full object-cover" src={owner.iconUrl ?? undefined} />
            </div>
            <div className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(10,20,40,0.95)] border border-[rgba(200,170,110,0.4)]">
              <Crown className="size-4 text-[rgb(200,170,110)]" />
            </div>
          </div>
          <p className="text-xl font-bold text-[rgb(200,170,110)] tracking-widest">{owner.displayName}</p>
        </section>
      )}

      <section className="shrink-0 py-4">
        <div className="grid grid-cols-4 gap-3">
          {displayOthers.map((member) => (
            <div
              key={member.summonerId}
              className="group flex flex-col items-center gap-2"
            >
              <div className="h-14 w-14 rounded-full overflow-hidden border border-[rgba(200,170,110,0.2)] opacity-70 group-hover:opacity-100 group-hover:border-[rgba(200,170,110,0.5)] group-hover:shadow-[0_0_15px_rgba(200,170,110,0.2)] transition-all duration-300">
                <img alt={member.displayName} className="h-full w-full object-cover" src={member.iconUrl ?? undefined} />
              </div>
              <span className="text-[10px] font-medium text-[rgba(200,170,110,0.6)] group-hover:text-[rgb(200,170,110)] transition-colors truncate max-w-full px-1">
                {member.displayName}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="flex-1" />

      <section className="shrink-0 py-4">
        <div className="flex flex-col items-center gap-5">
          <div className="flex items-center gap-2.5">
            <span className={`h-2 w-2 rounded-full ${isSearching ? 'bg-[rgb(200,170,110)] animate-pulse shadow-[0_0_8px_rgb(200,170,110)]' : 'bg-[rgba(200,170,110,0.3)]'}`} />
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[rgba(200,170,110,0.8)]">
              {isSearching ? 'Searching' : 'Not in queue'}
            </span>
          </div>

          <div className="flex w-full items-center gap-4">
            <button
              type="button"
              disabled={!canJoinQueue}
              onClick={onJoinQueue}
              className={`flex-1 rounded-full py-3.5 text-xs font-bold uppercase tracking-widest transition-all ${
                isSearching
                  ? 'bg-[rgba(10,20,40,0.6)] text-[rgba(200,170,110,0.4)] border border-[rgba(200,170,110,0.2)]'
                  : 'bg-[rgba(200,170,110,0.1)] text-[rgb(200,170,110)] border border-[rgba(200,170,110,0.4)] hover:bg-[rgba(200,170,110,0.15)] hover:border-[rgba(200,170,110,0.6)] hover:shadow-[0_0_20px_rgba(200,170,110,0.2)] active:scale-[0.98]'
              }`}
            >
              Find Match
            </button>
            <button
              type="button"
              onClick={onLeaveQueue}
              disabled={!isSearching}
              className="flex-1 rounded-full bg-[rgba(10,20,40,0.6)] border border-[rgba(200,170,110,0.3)] py-3.5 text-xs font-bold uppercase tracking-widest text-[rgba(200,170,110,0.5)] transition-all hover:border-[rgba(200,170,110,0.5)] hover:text-[rgba(200,170,110,0.8)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Leave
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
