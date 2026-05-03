import { Trans, useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RiftClientState, type RiftClientState as RiftClientStateValue } from '@core/rift/rift-client-types'
import { formatSeconds } from '@core/rift/rift-lcu-utils'
import type { LobbyDetails, QueueState } from '@core/rift/rift-lcu-types'
import type { LobbyMemberSnapshot } from '../-lobby-types'
import { buildMapIconUrl, buildSummonerIconUrl, formatRolePair } from '../-lobby-utils'

interface LobbyMembersCardProps {
  status: RiftClientStateValue | null
  lobbyDetails: LobbyDetails | null
  lobbyMembers: LobbyMemberSnapshot[]
  queueState: QueueState | null
  lobbyActionPending: boolean
  queueDodgePenaltySeconds: number
  memberActionPendingById: Record<number, boolean>
  mapId: number | null
  ddragonVersionValue: string | null
  joinQueue: () => Promise<void>
  leaveLobby: () => Promise<void>
  promoteMember: (member: LobbyMemberSnapshot) => Promise<void>
  toggleMemberInvite: (member: LobbyMemberSnapshot) => Promise<void>
  kickMember: (member: LobbyMemberSnapshot) => Promise<void>
  lobbyQueueOptions: { id: number; description: string }[]
  selectedQueueId: string
  setSelectedQueueId: (id: string) => void
  createLobby: () => Promise<void>
}

export function LobbyMembersCard({
  status,
  lobbyDetails,
  lobbyMembers,
  queueState,
  lobbyActionPending,
  queueDodgePenaltySeconds,
  memberActionPendingById,
  mapId,
  ddragonVersionValue,
  joinQueue,
  leaveLobby,
  promoteMember,
  toggleMemberInvite,
  kickMember,
  lobbyQueueOptions,
  selectedQueueId,
  setSelectedQueueId,
  createLobby,
}: LobbyMembersCardProps) {
  const { t } = useTranslation()
  const mapIconUrl = buildMapIconUrl(ddragonVersionValue, mapId)

  return (
    <Card className='relative overflow-hidden sm:col-span-2'>
      {mapIconUrl && lobbyDetails && (
        <>
          <img src={mapIconUrl} alt='' className='absolute inset-0 h-full w-full object-cover opacity-20' />
          <div className='absolute inset-0 bg-[#010a13]/80' />
        </>
      )}
      <CardHeader className='relative z-10 pb-3'>
        <CardTitle className='font-display text-xs uppercase tracking-[0.2em] text-primary'>
          {t(($) => $.connected.lobby)}
        </CardTitle>
      </CardHeader>
      <CardContent className='relative z-10'>
        {lobbyDetails ? (
          <div className='space-y-6'>
            <div className='grid gap-3 sm:grid-cols-2'>
              <div className='flex justify-between items-center border-b border-gold-dim/20 pb-2 text-sm text-muted-foreground'>
                <Trans
                  components={{ value: <span className='text-foreground font-semibold ml-auto' /> }}
                  i18nKey={($) => $.connected.membersValue}
                  values={{ value: String(lobbyDetails.memberCount) }}
                />
              </div>
              <div className='flex justify-between items-center border-b border-gold-dim/20 pb-2 text-sm text-muted-foreground'>
                <Trans
                  components={{ value: <span className='text-foreground font-semibold ml-auto' /> }}
                  i18nKey={($) => $.connected.invitesValue}
                  values={{ value: String(lobbyDetails.inviteCount) }}
                />
              </div>
              <div className='flex justify-between items-center border-b border-gold-dim/20 pb-2 text-sm text-muted-foreground'>
                <Trans
                  components={{ value: <span className='text-foreground font-semibold ml-auto' /> }}
                  i18nKey={($) => $.connected.queueLabelValue}
                  values={{
                    value: String(lobbyDetails.queueName ?? lobbyDetails.queueId ?? t(($) => $.connected.unknown)),
                  }}
                />
              </div>
              <div className='flex justify-between items-center border-b border-gold-dim/20 pb-2 text-sm text-muted-foreground'>
                <Trans
                  components={{ value: <span className='text-foreground font-semibold ml-auto' /> }}
                  i18nKey={($) => $.connected.mapValue}
                  values={{
                    value: String(lobbyDetails.mapName ?? lobbyDetails.mapId ?? t(($) => $.connected.unknown)),
                  }}
                />
              </div>
            </div>

            <div className='flex flex-wrap gap-3'>
              <Button
                variant='default'
                className='font-display tracking-wider uppercase'
                disabled={lobbyActionPending || Boolean(queueState)}
                onClick={() => {
                  void joinQueue()
                }}
                type='button'
              >
                {t(($) => $.connected.lobbyJoinQueue)}
              </Button>
              <Button
                variant='destructive'
                className='font-display tracking-wider uppercase'
                disabled={lobbyActionPending}
                onClick={() => {
                  void leaveLobby()
                }}
                type='button'
              >
                {t(($) => $.connected.lobbyLeave)}
              </Button>
              {queueDodgePenaltySeconds >= 0 ? (
                <p className='self-center text-sm text-destructive'>
                  <Trans
                    components={{ value: <span className='font-semibold' /> }}
                    i18nKey={($) => $.connected.queueBlockedValue}
                    values={{ value: String(formatSeconds(queueDodgePenaltySeconds)) }}
                  />
                </p>
              ) : null}
            </div>

            {lobbyMembers.length > 0 ? (
              <div className='space-y-3'>
                {lobbyMembers.map((member) => {
                  const actionPending = memberActionPendingById[member.summonerId]
                  const canModerate = Boolean(lobbyDetails.localIsLeader && !member.isLocalMember)
                  const memberName = member.displayName ?? t(($) => $.connected.unknownSummoner)

                  return (
                    <div
                      className='group flex flex-col gap-3 rounded-xl border border-gold-dim/30 bg-background/60 p-4 transition-colors hover:border-primary/60 sm:flex-row sm:items-center sm:justify-between'
                      key={member.summonerId}
                    >
                      <div className='flex min-w-0 items-center gap-4'>
                        <div className='relative'>
                          {buildSummonerIconUrl(ddragonVersionValue, member.profileIconId) ? (
                            <img
                              alt={memberName}
                              className={`h-12 w-12 rounded-full object-cover shadow-lg ${member.isLocalMember ? 'border-4 border-gold shadow-[0_0_15px_rgba(200,169,110,0.8)]' : 'border-2 border-primary shadow-[0_0_10px_rgba(200,169,110,0.3)]'}`}
                              src={buildSummonerIconUrl(ddragonVersionValue, member.profileIconId) ?? undefined}
                            />
                          ) : (
                            <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-sm font-bold text-muted-foreground shadow-lg ${member.isLocalMember ? 'border-4 border-gold shadow-[0_0_15px_rgba(200,169,110,0.8)]' : 'border-2 border-primary shadow-[0_0_10px_rgba(200,169,110,0.3)]'}`}>
                              {memberName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {member.isLeader && (
                            <div className='absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-background shadow-sm'>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className='min-w-0'>
                          <p className='truncate font-semibold text-foreground text-lg'>
                            {memberName}
                          </p>
                          {lobbyDetails.showPositionSelector ? (
                            <p className='text-sm text-muted-foreground'>
                              {formatRolePair(
                                member.firstPositionPreference,
                                member.secondPositionPreference,
                                t(($) => $.connected.roleFill),
                                t(($) => $.connected.roleUnset),
                              )}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {canModerate ? (
                        <div className='flex flex-wrap gap-2 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100'>
                          <Button
                            variant='outline'
                            size='sm'
                            className='font-display tracking-wider uppercase'
                            disabled={Boolean(actionPending)}
                            onClick={() => {
                              void promoteMember(member)
                            }}
                            type='button'
                          >
                            {t(($) => $.connected.memberPromote)}
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            className='font-display tracking-wider uppercase'
                            disabled={Boolean(actionPending)}
                            onClick={() => {
                              void toggleMemberInvite(member)
                            }}
                            type='button'
                          >
                            {member.allowedInviteOthers
                              ? t(($) => $.connected.memberInviteRevoke)
                              : t(($) => $.connected.memberInviteGrant)}
                          </Button>
                          <Button
                            variant='destructive'
                            size='sm'
                            className='font-display tracking-wider uppercase'
                            disabled={Boolean(actionPending)}
                            onClick={() => {
                              void kickMember(member)
                            }}
                            type='button'
                          >
                            {t(($) => $.connected.memberKick)}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            ) : null}
          </div>
        ) : status === RiftClientState.CONNECTED ? (
          <div className='space-y-3'>
            <Skeleton className='h-16 w-full rounded-xl' />
            <Skeleton className='h-16 w-full rounded-xl' />
            <Skeleton className='h-16 w-full rounded-xl' />
          </div>
        ) : (
          <div className='space-y-4'>
            <p className='text-muted-foreground'>{t(($) => $.connected.noLobbySnapshot)}</p>
            <p className='text-sm text-muted-foreground'>{t(($) => $.connected.noLobbyCreateHint)}</p>
            {lobbyQueueOptions.length > 0 ? (
              <div className='flex flex-col gap-3 sm:flex-row'>
                <label className='sr-only' htmlFor='queue-id'>
                  {t(($) => $.connected.queueSelectLabel)}
                </label>
                <select
                  className='h-10 rounded-md border border-gold-dim/50 bg-background/60 px-3 text-foreground outline-none focus:border-primary'
                  id='queue-id'
                  onChange={(event) => {
                    setSelectedQueueId(event.target.value)
                  }}
                  value={selectedQueueId}
                >
                  {lobbyQueueOptions.map((option) => (
                    <option key={option.id} value={option.id} className='bg-background text-foreground'>
                      {option.description}
                    </option>
                  ))}
                </select>
                <Button
                  variant='default'
                  className='font-display tracking-wider uppercase'
                  disabled={lobbyActionPending || !selectedQueueId}
                  onClick={() => {
                    void createLobby()
                  }}
                  type='button'
                >
                  {t(($) => $.connected.createLobby)}
                </Button>
              </div>
            ) : (
                <p className='text-sm text-muted-foreground italic'>{t(($) => $.connected.noQueueOptions)}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
