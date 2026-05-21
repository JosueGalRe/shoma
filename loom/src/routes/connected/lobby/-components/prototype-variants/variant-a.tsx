import { Crown } from 'lucide-react'
import { SummonerId } from '@/core/types/branded'
import type { LobbyMember } from '@/features/lobby/lobby-store'

interface VariantAProps {
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
      className="size-6 rounded-full border border-[rgba(200,170,110,0.3)] bg-[rgba(10,20,40,0.8)]"
      src={url}
    />
  )
}

function MockMemberCard({ member }: { member: LobbyMember }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <div className="h-14 w-14 rounded-full border border-[rgba(200,170,110,0.4)] shadow-[0_0_10px_rgba(200,170,110,0.15)] overflow-hidden">
          <img
            alt={member.displayName}
            className="h-full w-full object-cover"
            src={member.iconUrl ?? undefined}
          />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-center font-medium text-xs text-[rgb(200,170,110)] truncate w-20">
          {member.displayName}
        </span>
        <div className="flex items-center gap-1">
          {member.firstPositionPreference !== 'UNSELECTED' && (
            <MemberRuneIcon role={member.firstPositionPreference} />
          )}
          {member.secondPositionPreference !== 'UNSELECTED' && member.firstPositionPreference !== 'FILL' && (
            <MemberRuneIcon role={member.secondPositionPreference} />
          )}
        </div>
      </div>
    </div>
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

export function VariantA({
  members,
  queueStatus,
  canJoinQueue,
  onJoinQueue,
  onLeaveQueue,
  isConnected,
  isActionPending,
}: VariantAProps) {
  const owner = members.find((m) => m.isLeader) ?? members[0]
  const others = members.filter((m) => m.summonerId !== owner?.summonerId)
  const displayOthers = others.length >= 4 ? others.slice(0, 4) : [...others, ...MOCK_MEMBERS].slice(0, 4)
  const isSearching = queueStatus.isSearching

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[rgb(10,20,40)]">
      <section className="shrink-0 px-4 py-4">
        {owner && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-[rgba(200,170,110,0.3)] bg-gradient-to-b from-[rgba(200,170,110,0.1)] to-[rgba(10,20,40,0.8)] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <div className="relative">
              <div className="h-24 w-24 border-2 border-[rgba(200,170,110,0.8)] shadow-[0_0_30px_rgba(200,170,110,0.4),inset_0_0_20px_rgba(200,170,110,0.2)] rounded-full overflow-hidden">
                <img
                  alt={owner.displayName}
                  className="h-full w-full object-cover"
                  src={owner.iconUrl ?? undefined}
                />
              </div>
              <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(200,170,110,0.6)] bg-[rgba(10,20,40,0.95)] shadow-[0_0_10px_rgba(200,170,110,0.3)]">
                <Crown className="size-4 text-[rgb(200,170,110)]" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-center font-bold text-lg text-[rgb(200,170,110)] tracking-wide">
                {owner.displayName}
              </span>
              <div className="flex items-center gap-1.5">
                {owner.firstPositionPreference !== 'UNSELECTED' && (
                  <MemberRuneIcon role={owner.firstPositionPreference} />
                )}
                {owner.secondPositionPreference !== 'UNSELECTED' && owner.firstPositionPreference !== 'FILL' && (
                  <MemberRuneIcon role={owner.secondPositionPreference} />
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="shrink-0 px-4 py-2">
        <div className="grid grid-cols-2 gap-4">
          {displayOthers.map((member) => (
            <div
              key={member.summonerId}
              className="flex flex-col items-center gap-2 rounded-2xl border border-[rgba(200,170,110,0.2)] bg-[rgba(10,20,40,0.6)] p-4 shadow-[0_4px_15px_rgba(0,0,0,0.3)]"
            >
              <MockMemberCard member={member} />
            </div>
          ))}
        </div>
      </section>

      <div className="flex-1" />

      <section className="shrink-0 px-4 py-4">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-[rgba(200,170,110,0.3)] bg-[rgba(10,20,40,0.8)] p-5 shadow-[0_-4px_20px_rgba(0,0,0,0.4)] backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${isSearching ? 'bg-[rgb(200,170,110)] animate-pulse shadow-[0_0_8px_rgb(200,170,110)]' : 'bg-[rgba(200,170,110,0.3)]'}`} />
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[rgba(200,170,110,0.9)]">
              {isSearching ? 'Searching...' : 'You are not in a queue.'}
            </span>
          </div>

          <div className="flex w-full items-center gap-3">
            <button
              type="button"
              disabled={!canJoinQueue}
              onClick={onJoinQueue}
              className={`flex-1 rounded-full border px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
                isSearching
                  ? 'border-[rgba(200,170,110,0.3)] bg-[rgba(10,20,40,0.6)] text-[rgba(200,170,110,0.5)]'
                  : 'border-[rgba(200,170,110,0.6)] bg-gradient-to-r from-[rgba(200,170,110,0.2)] to-[rgba(200,170,110,0.05)] text-[rgb(200,170,110)] hover:from-[rgba(200,170,110,0.3)] hover:to-[rgba(200,170,110,0.1)] hover:shadow-[0_0_25px_rgba(200,170,110,0.25)] active:scale-[0.98]'
              }`}
            >
              Find Match
            </button>
            <button
              type="button"
              onClick={onLeaveQueue}
              disabled={!isSearching}
              className="flex-1 rounded-full border border-[rgba(200,170,110,0.4)] bg-[rgba(10,20,40,0.8)] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[rgba(200,170,110,0.6)] transition-all hover:border-[rgba(200,170,110,0.6)] hover:bg-[rgba(200,170,110,0.1)] hover:text-[rgba(200,170,110,0.9)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Leave
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
