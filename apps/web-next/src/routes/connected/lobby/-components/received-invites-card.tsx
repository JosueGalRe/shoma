import { Button } from '@/components/ui/button'
import type { InviteResponse } from '../-lobby-types'

interface ConnectedReceivedInvitesCardProps {
  title: string
  noPendingInvitesLabel: string
  unknownLabel: string
  unknownSummonerLabel: string
  inviteAcceptLabel: string
  inviteDeclineLabel: string
  pendingInvites: Array<{
    invitationId: string
    state: string
    fromSummonerId: number
    gameConfig: { queueId?: number; mapId?: number }
  }>
  inviteDetailsById: Record<string, { summonerName: string | null; profileIconId: number | null; queueName: string | null; mapName: string | null }>
  inviteActionPendingById: Record<string, boolean>
  formatInviteDetailsLabel: (map: string | null, queue: string | null) => string
  buildSummonerIconUrl: (profileIconId: number | null) => string | null
  onRespond: (invitationId: string, action: InviteResponse) => void
}

export function ConnectedReceivedInvitesCard(props: ConnectedReceivedInvitesCardProps) {
  const {
    title,
    noPendingInvitesLabel,
    unknownSummonerLabel,
    inviteAcceptLabel,
    inviteDeclineLabel,
    pendingInvites,
    inviteDetailsById,
    inviteActionPendingById,
    formatInviteDetailsLabel,
    buildSummonerIconUrl,
    onRespond,
  } = props

  return (
    <div className='rounded-xl border border-[#1e2328] bg-[#0a1428]/80 p-4 shadow-xl backdrop-blur-sm sm:col-span-2'>
      <h3 className='font-display text-sm uppercase tracking-[0.2em] text-[#c8a96e]'>{title}</h3>
      {pendingInvites.length > 0 ? (
        <div className='mt-3 space-y-2'>
          {pendingInvites.map((invite) => {
            const detail = inviteDetailsById[invite.invitationId]
            const isPending = inviteActionPendingById[invite.invitationId]
            const summonerName = detail?.summonerName ?? unknownSummonerLabel
            const iconUrl = buildSummonerIconUrl(detail?.profileIconId ?? null)

            return (
              <div
                key={invite.invitationId}
                className='flex items-center gap-3 rounded-lg border border-[#1e2328] bg-[#1e2328]/50 p-3'
              >
                {iconUrl ? (
                  <img alt={summonerName} className='h-10 w-10 rounded-full border border-[#785a28] object-cover' src={iconUrl} />
                ) : (
                  <div className='flex h-10 w-10 items-center justify-center rounded-full border border-[#785a28] bg-[#0a1428] text-xs font-bold text-[#785a28]'>?</div>
                )}
                <div className='min-w-0 flex-1'>
                  <p className='truncate font-semibold text-[#f0e6d2]'>{summonerName}</p>
                  <p className='text-xs text-[#a09b8c]'>
                    {formatInviteDetailsLabel(detail?.mapName ?? null, detail?.queueName ?? null)}
                  </p>
                </div>
                <div className='flex gap-2'>
                  <Button
                    className='h-8 rounded-lg bg-gradient-to-b from-[#c8a96e] to-[#785a28] px-3 text-xs font-semibold text-[#010a13] shadow-md'
                    disabled={isPending}
                    onClick={() => onRespond(invite.invitationId, 'accept')}
                    type='button'
                  >
                    {inviteAcceptLabel}
                  </Button>
                  <Button
                    className='h-8 rounded-lg border border-[#d32f2f]/50 bg-transparent px-3 text-xs text-[#d32f2f] hover:bg-[#d32f2f]/10'
                    disabled={isPending}
                    onClick={() => onRespond(invite.invitationId, 'decline')}
                    type='button'
                    variant='outline'
                  >
                    {inviteDeclineLabel}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className='mt-2 text-sm text-[#a09b8c]'>{noPendingInvitesLabel}</p>
      )}
    </div>
  )
}
