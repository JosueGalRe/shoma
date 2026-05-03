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
    <div className='rounded-xl border border-secondary bg-card/80 p-4 shadow-xl backdrop-blur-sm sm:col-span-2'>
      <h3 className='font-display text-sm uppercase tracking-[0.2em] text-primary'>{title}</h3>
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
                className='flex items-center gap-3 rounded-lg border border-secondary bg-secondary/50 p-3'
              >
                {iconUrl ? (
                  <img alt={summonerName} className='h-10 w-10 rounded-full border border-gold-dim object-cover' src={iconUrl} />
                ) : (
                  <div className='flex h-10 w-10 items-center justify-center rounded-full border border-gold-dim bg-card text-xs font-bold text-gold-dim'>?</div>
                )}
                <div className='min-w-0 flex-1'>
                  <p className='truncate font-semibold text-foreground'>{summonerName}</p>
                  <p className='text-xs text-muted-foreground'>
                    {formatInviteDetailsLabel(detail?.mapName ?? null, detail?.queueName ?? null)}
                  </p>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Button
                    className='h-8 rounded-lg bg-gradient-to-b from-primary to-gold-dim px-3 text-xs font-semibold text-background shadow-md'
                    disabled={isPending}
                    onClick={() => onRespond(invite.invitationId, 'accept')}
                    type='button'
                  >
                    {inviteAcceptLabel}
                  </Button>
                  <Button
                    className='h-8 rounded-lg border border-destructive/50 bg-transparent px-3 text-xs text-destructive hover:bg-destructive/10'
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
        <div className='mt-8 flex flex-col items-center justify-center space-y-3 py-8 text-center'>
          <div className='flex h-16 w-16 items-center justify-center rounded-full bg-secondary/50'>
            <svg
              className='h-8 w-8 text-muted-foreground/50'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1.5}
                d='M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76'
              />
            </svg>
          </div>
          <p className='text-sm text-muted-foreground'>{noPendingInvitesLabel}</p>
        </div>
      )}
    </div>
  )
}
