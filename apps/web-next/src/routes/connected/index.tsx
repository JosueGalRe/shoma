import { Link, createFileRoute } from '@tanstack/react-router'
import { useQueries, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { RiftClientState } from '../../core/rift/rift-client-types'
import { formatSeconds } from '../../core/rift/rift-lcu-utils'
import { useRiftStore } from '../../core/rift/rift-store'
import { LanguageSwitcher } from '../../features/i18n/language-switcher'
import { useRiftLcuRuntime } from '../../features/connect/hooks/use-rift-lcu-runtime'
import {
  championNamesQueryOptions,
  ddragonVersionQueryOptions,
  type DdragonLanguage,
} from '../../core/http/ddragon-client'
import type { InviteDetailsById } from './-connected-types'
import {
  buildSummonerIconUrl,
  formatChampionLabel,
  readAudioContextConstructor,
  readSummonerData,
} from './-connected-utils'

export const Route = createFileRoute('/connected/')({
  component: ConnectedRoute,
})

function ConnectedRoute() {
  const { i18n, t } = useTranslation()
  const {
    status,
    client,
    peerName,
    peerVersion,
    queueState,
    lobbyDetails,
    readyCheckState,
    invites,
    champSelectState,
    logLines,
    setPeer,
    appendLog,
  } = useRiftStore()
  const [readyCheckPending, setReadyCheckPending] = useState(false)
  const [inviteActionPendingById, setInviteActionPendingById] = useState<Record<string, boolean>>({})
  const previousReadyCheckStateRef = useRef<string | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const canPlayQueuePopRef = useRef(false)

  const { data: ddragonVersion } = useQuery(ddragonVersionQueryOptions())
  const ddragonLanguage: DdragonLanguage = i18n.resolvedLanguage?.startsWith('es') ? 'es' : 'en'
  const { data: championNamesById = {} } = useQuery({
    ...championNamesQueryOptions(ddragonVersion ?? '', ddragonLanguage),
    enabled: Boolean(ddragonVersion),
  })
  const ddragonVersionValue = ddragonVersion ?? null

  const { getMapName, getQueueDescription, lcuTransport } = useRiftLcuRuntime({
    appendLog,
    client,
    setPeer,
    status,
  })

  const pendingInvites = useMemo(() => {
    return invites.filter((invite) => {
      return invite.state === 'Pending'
    })
  }, [invites])

  const inviteDetailQueries = useMemo(() => {
    return pendingInvites.map((invite) => {
      return {
        queryKey: ['invite-detail', invite.invitationId, invite.fromSummonerId, invite.gameConfig.queueId, invite.gameConfig.mapId] as const,
        queryFn: async () => {
          try {
            const summonerResponse = await lcuTransport.request(`/lol-summoner/v1/summoners/${invite.fromSummonerId}`)
            const summonerData =
              summonerResponse.status === 200
                ? readSummonerData(summonerResponse.content)
                : {
                    displayName: null,
                    profileIconId: null,
                  }

            let queueName: string | null = null
            if (typeof invite.gameConfig.queueId === 'number') {
              queueName = await getQueueDescription(invite.gameConfig.queueId)
            }

            let mapName: string | null = null
            if (typeof invite.gameConfig.mapId === 'number') {
              mapName = await getMapName(invite.gameConfig.mapId)
            }

            return {
              mapName,
              queueName,
              summonerName: summonerData.displayName,
              profileIconId: summonerData.profileIconId,
            }
          } catch (error) {
            appendLog(`invite detail load failed: ${String(error)}`)

            return {
              mapName: null,
              queueName: null,
              summonerName: null,
              profileIconId: null,
            }
          }
        },
        enabled: status === RiftClientState.CONNECTED,
        staleTime: 30_000,
      }
    })
  }, [appendLog, getMapName, getQueueDescription, lcuTransport, pendingInvites, status])

  const inviteDetailResults = useQueries({
    queries: inviteDetailQueries,
  })

  const inviteDetailsById = useMemo(() => {
    const nextInviteDetailsById: InviteDetailsById = {}

    pendingInvites.forEach((invite, index) => {
      const detail = inviteDetailResults[index]?.data
      if (!detail) {
        return
      }

      nextInviteDetailsById[invite.invitationId] = detail
    })

    return nextInviteDetailsById
  }, [inviteDetailResults, pendingInvites])

  async function sendReadyCheckResponse(path: string, logMessage: string) {
    if (readyCheckPending || status !== RiftClientState.CONNECTED) {
      return
    }

    setReadyCheckPending(true)
    try {
      await lcuTransport.request(path, 'POST')
    } catch (error) {
      appendLog(`${logMessage}: ${String(error)}`)
    } finally {
      setReadyCheckPending(false)
    }
  }

  async function acceptReadyCheck() {
    await sendReadyCheckResponse('/lol-matchmaking/v1/ready-check/accept', 'ready check accept failed')
  }

  async function declineReadyCheck() {
    await sendReadyCheckResponse('/lol-matchmaking/v1/ready-check/decline', 'ready check decline failed')
  }

  async function sendInviteResponse(invitationId: string, action: 'accept' | 'decline') {
    if (status !== RiftClientState.CONNECTED || inviteActionPendingById[invitationId]) {
      return
    }

    setInviteActionPendingById((previous) => {
      return {
        ...previous,
        [invitationId]: true,
      }
    })

    try {
      await lcuTransport.request(`/lol-lobby/v2/received-invitations/${invitationId}/${action}`, 'POST')
    } catch (error) {
      appendLog(`invite ${action} failed (${invitationId}): ${String(error)}`)
    } finally {
      setInviteActionPendingById((previous) => {
        return {
          ...previous,
          [invitationId]: false,
        }
      })
    }
  }

  const readyCheckVisible = readyCheckState?.state === 'InProgress'
  const readyCheckResponded =
    readyCheckState?.playerResponse === 'Accepted' || readyCheckState?.playerResponse === 'Declined'

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const AudioContextCtor = readAudioContextConstructor()
    if (!AudioContextCtor) {
      canPlayQueuePopRef.current = false
      return
    }

    const unlockAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextCtor()
      }

      void audioContextRef.current.resume()
      canPlayQueuePopRef.current = true
    }

    window.addEventListener('pointerdown', unlockAudio, { passive: true })
    window.addEventListener('touchstart', unlockAudio, { passive: true })

    return () => {
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('touchstart', unlockAudio)
    }
  }, [])

  useEffect(() => {
    const previousState = previousReadyCheckStateRef.current
    const currentState = readyCheckState?.state ?? null
    previousReadyCheckStateRef.current = currentState

    if (previousState !== 'Invalid' || currentState !== 'InProgress') {
      return
    }

    if (canPlayQueuePopRef.current && audioContextRef.current) {
      try {
        const now = audioContextRef.current.currentTime
        const firstOscillator = audioContextRef.current.createOscillator()
        const secondOscillator = audioContextRef.current.createOscillator()
        const gainNode = audioContextRef.current.createGain()

        firstOscillator.type = 'sine'
        firstOscillator.frequency.value = 880
        secondOscillator.type = 'sine'
        secondOscillator.frequency.value = 660

        gainNode.gain.setValueAtTime(0.001, now)
        gainNode.gain.exponentialRampToValueAtTime(0.12, now + 0.02)
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45)

        firstOscillator.connect(gainNode)
        secondOscillator.connect(gainNode)
        gainNode.connect(audioContextRef.current.destination)

        firstOscillator.start(now)
        secondOscillator.start(now + 0.12)
        firstOscillator.stop(now + 0.2)
        secondOscillator.stop(now + 0.45)
      } catch (error) {
        appendLog(`ready check sound failed: ${String(error)}`)
      }
    }

    if ('vibrate' in navigator) {
      navigator.vibrate([500, 250, 500, 250, 500, 250, 500, 250])
    }
  }, [appendLog, readyCheckState?.state])

  if (status !== RiftClientState.CONNECTED) {
    return (
      <main className='mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-5 py-10 sm:px-8'>
        <Card className='rounded-3xl border-white/60 bg-white/75 p-6 shadow-2xl backdrop-blur sm:p-10'>
          <h1 className='font-display text-ink text-3xl'>{t(($) => $.connected.unavailableTitle)}</h1>
          <p className='mt-3 text-slate-700'>{t(($) => $.connected.unavailableBody)}</p>
          <Button asChild className='bg-ink font-display text-mist hover:bg-slate mt-6 h-12 rounded-2xl px-5'>
            <Link to='/'>{t(($) => $.connected.backToConnect)}</Link>
          </Button>
        </Card>
      </main>
    )
  }

  return (
    <main className='mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-5 py-10 sm:px-8'>
      <Card className='rounded-3xl border-white/60 bg-white/75 p-6 shadow-2xl backdrop-blur sm:p-10'>
        <div className='flex items-center justify-between gap-3'>
          <h1 className='font-display text-ink text-4xl leading-tight'>{t(($) => $.connected.title)}</h1>
          <div className='flex items-center gap-2'>
            <LanguageSwitcher />
            <Button asChild variant='outline' className='font-display h-11 rounded-2xl border-slate-300 px-4 text-slate-700'>
              <Link to='/'>{t(($) => $.connected.back)}</Link>
            </Button>
          </div>
        </div>

        <div className='mt-8 grid gap-4 sm:grid-cols-2'>
          <Card className='rounded-2xl border-slate-200 bg-white p-4'>
            <h3 className='font-display text-slate text-sm tracking-[0.2em] uppercase'>{t(($) => $.connected.desktop)}</h3>
            <p className='mt-2 text-slate-700'>{peerName ?? t(($) => $.connected.unknownMachine)}</p>
            <p className='text-sm text-slate-500'>
              <Trans
                components={{ value: <span className='font-semibold' /> }}
                i18nKey={($) => $.connected.versionValue}
                values={{ value: peerVersion ?? t(($) => $.connected.pending) }}
              />
            </p>
          </Card>

          <Card className='rounded-2xl border-slate-200 bg-white p-4'>
            <h3 className='font-display text-slate text-sm tracking-[0.2em] uppercase'>{t(($) => $.connected.queue)}</h3>
            {queueState ? (
              <div className='mt-2 space-y-2 text-slate-700'>
                <p>
                  <Trans
                    components={{ value: <span className='font-semibold' /> }}
                    i18nKey={($) => $.connected.stateValue}
                    values={{ value: queueState.searchState ?? t(($) => $.connected.searching) }}
                  />
                </p>
                <p>
                  <Trans
                    components={{ value: <span className='font-semibold' /> }}
                    i18nKey={($) => $.connected.elapsedValue}
                    values={{ value: formatSeconds(queueState.timeInQueue ?? 0) }}
                  />
                </p>
                <p>
                  <Trans
                    components={{ value: <span className='font-semibold' /> }}
                    i18nKey={($) => $.connected.estimatedValue}
                    values={{ value: formatSeconds(queueState.estimatedQueueTime ?? 0) }}
                  />
                </p>
              </div>
            ) : (
              <p className='mt-2 text-slate-600'>{t(($) => $.connected.notInQueue)}</p>
            )}
          </Card>

          <Card className='rounded-2xl border-slate-200 bg-white p-4'>
            <h3 className='font-display text-slate text-sm tracking-[0.2em] uppercase'>{t(($) => $.connected.readyCheck)}</h3>
            {readyCheckVisible && readyCheckState ? (
              <div className='mt-2 space-y-3 text-slate-700'>
                <p>
                  <Trans
                    components={{ value: <span className='font-semibold' /> }}
                    i18nKey={($) => $.connected.readyCheckTimerValue}
                    values={{ value: readyCheckState.timer }}
                  />
                </p>
                <p>
                  <Trans
                    components={{ value: <span className='font-semibold' /> }}
                    i18nKey={($) => $.connected.readyCheckResponseValue}
                    values={{ value: readyCheckState.playerResponse }}
                  />
                </p>
                <div className='flex gap-2'>
                  <Button
                    className='font-display h-10 rounded-xl bg-emerald-600 px-4 text-white hover:bg-emerald-700'
                    disabled={readyCheckPending || readyCheckResponded}
                    onClick={acceptReadyCheck}
                    type='button'
                  >
                    {t(($) => $.connected.readyCheckAccept)}
                  </Button>
                  <Button
                    className='font-display h-10 rounded-xl bg-rose-600 px-4 text-white hover:bg-rose-700'
                    disabled={readyCheckPending || readyCheckResponded}
                    onClick={declineReadyCheck}
                    type='button'
                  >
                    {t(($) => $.connected.readyCheckDecline)}
                  </Button>
                </div>
              </div>
            ) : (
              <p className='mt-2 text-slate-600'>{t(($) => $.connected.readyCheckNone)}</p>
            )}
          </Card>

          <Card className='rounded-2xl border-slate-200 bg-white p-4 sm:col-span-2'>
            <h3 className='font-display text-slate text-sm tracking-[0.2em] uppercase'>{t(($) => $.connected.lobby)}</h3>
            {lobbyDetails ? (
              <div className='mt-2 grid gap-2 text-slate-700 sm:grid-cols-2'>
                <p>
                  <Trans
                    components={{ value: <span className='font-semibold' /> }}
                    i18nKey={($) => $.connected.membersValue}
                    values={{ value: lobbyDetails.memberCount }}
                  />
                </p>
                <p>
                  <Trans
                    components={{ value: <span className='font-semibold' /> }}
                    i18nKey={($) => $.connected.invitesValue}
                    values={{ value: lobbyDetails.inviteCount }}
                  />
                </p>
                <p>
                  <Trans
                    components={{ value: <span className='font-semibold' /> }}
                    i18nKey={($) => $.connected.queueLabelValue}
                    values={{
                      value: lobbyDetails.queueName ?? lobbyDetails.queueId ?? t(($) => $.connected.unknown),
                    }}
                  />
                </p>
                <p>
                  <Trans
                    components={{ value: <span className='font-semibold' /> }}
                    i18nKey={($) => $.connected.mapValue}
                    values={{
                      value: lobbyDetails.mapName ?? lobbyDetails.mapId ?? t(($) => $.connected.unknown),
                    }}
                  />
                </p>
              </div>
            ) : (
              <p className='mt-2 text-slate-600'>{t(($) => $.connected.noLobbySnapshot)}</p>
            )}
          </Card>

          <Card className='rounded-2xl border-slate-200 bg-white p-4 sm:col-span-2'>
            <h3 className='font-display text-slate text-sm tracking-[0.2em] uppercase'>{t(($) => $.connected.champSelectTitle)}</h3>
            {champSelectState ? (
              <div className='mt-2 grid gap-2 text-slate-700 sm:grid-cols-2'>
                <p>
                  {t(($) => $.connected.champSelectPhaseLabel)}: <span className='font-semibold'>{champSelectState.phase}</span>
                </p>
                <p>
                  {t(($) => $.connected.champSelectTimeLeftLabel)}:{' '}
                  <span className='font-semibold'>
                    {champSelectState.timeLeftInPhaseMs !== null
                      ? formatSeconds(Math.round(champSelectState.timeLeftInPhaseMs / 1000))
                      : t(($) => $.connected.unknown)}
                  </span>
                </p>
                <p>
                  {t(($) => $.connected.champSelectMyTeamLabel)}:{' '}
                  <span className='font-semibold'>{champSelectState.myTeamCount}</span>
                </p>
                <p>
                  {t(($) => $.connected.champSelectEnemyTeamLabel)}:{' '}
                  <span className='font-semibold'>{champSelectState.theirTeamCount}</span>
                </p>
                <p>
                  {t(($) => $.connected.champSelectLocalCellLabel)}:{' '}
                  <span className='font-semibold'>{champSelectState.localPlayerCellId ?? t(($) => $.connected.unknown)}</span>
                </p>
                <p>
                  {t(($) => $.connected.champSelectSelectedChampLabel)}:{' '}
                  <span className='font-semibold'>
                    {formatChampionLabel(champSelectState.localPlayerChampionId, championNamesById, t(($) => $.connected.unknown))}
                  </span>
                </p>
                <p>
                  {t(($) => $.connected.champSelectCurrentActionLabel)}:{' '}
                  <span className='font-semibold'>{champSelectState.currentActionType ?? t(($) => $.connected.unknown)}</span>
                </p>
                <p>
                  {t(($) => $.connected.champSelectYourTurnLabel)}:{' '}
                  <span className='font-semibold'>
                    {champSelectState.isLocalPlayerTurn ? t(($) => $.connected.yes) : t(($) => $.connected.no)}
                  </span>
                </p>
                <p>
                  {t(($) => $.connected.champSelectActionChampionLabel)}:{' '}
                  <span className='font-semibold'>
                    {formatChampionLabel(champSelectState.currentActionChampionId, championNamesById, t(($) => $.connected.unknown))}
                  </span>
                </p>
                <p>
                  {t(($) => $.connected.champSelectLockedInLabel)}:{' '}
                  <span className='font-semibold'>
                    {champSelectState.hasLockedChampion ? t(($) => $.connected.yes) : t(($) => $.connected.no)}
                  </span>
                </p>
              </div>
            ) : (
              <p className='mt-2 text-slate-600'>{t(($) => $.connected.champSelectNoSession)}</p>
            )}
          </Card>

          <Card className='rounded-2xl border-slate-200 bg-white p-4 sm:col-span-2'>
            <h3 className='font-display text-slate text-sm tracking-[0.2em] uppercase'>{t(($) => $.connected.invites)}</h3>
            {pendingInvites.length > 0 ? (
              <ul className='mt-2 space-y-3'>
                {pendingInvites.map((invite) => {
                  const details = inviteDetailsById[invite.invitationId]
                  const actionPending = inviteActionPendingById[invite.invitationId]

                  return (
                    <li className='rounded-xl border border-slate-200 bg-slate-50 p-3' key={invite.invitationId}>
                      <div className='flex items-start gap-3'>
                        {buildSummonerIconUrl(ddragonVersionValue, details?.profileIconId ?? null) ? (
                          <img
                            alt={details?.summonerName ?? t(($) => $.connected.unknownSummoner)}
                            className='mt-0.5 h-11 w-11 rounded-full border border-slate-200 bg-white object-cover'
                            src={buildSummonerIconUrl(ddragonVersionValue, details?.profileIconId ?? null) ?? undefined}
                          />
                        ) : (
                          <div className='mt-0.5 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-500'>
                            ?
                          </div>
                        )}
                        <div className='min-w-0 flex-1'>
                          <p className='truncate font-semibold text-slate-800'>
                            {details?.summonerName ?? t(($) => $.connected.unknownSummoner)}
                          </p>
                          <p className='text-sm text-slate-600'>
                            <Trans
                              components={{ value: <span className='font-semibold' /> }}
                              i18nKey={($) => $.connected.inviteDetailsValue}
                              values={{
                                map: details?.mapName ?? t(($) => $.connected.unknown),
                                queue: details?.queueName ?? t(($) => $.connected.unknown),
                              }}
                            />
                          </p>
                        </div>
                      </div>
                      <div className='mt-3 flex gap-2'>
                        <Button
                          className='font-display h-9 rounded-xl bg-emerald-600 px-3 text-white hover:bg-emerald-700'
                          disabled={actionPending || !invite.canAcceptInvitation}
                          onClick={() => {
                            void sendInviteResponse(invite.invitationId, 'accept')
                          }}
                          type='button'
                        >
                          {t(($) => $.connected.inviteAccept)}
                        </Button>
                        <Button
                          className='font-display h-9 rounded-xl bg-rose-600 px-3 text-white hover:bg-rose-700'
                          disabled={actionPending}
                          onClick={() => {
                            void sendInviteResponse(invite.invitationId, 'decline')
                          }}
                          type='button'
                        >
                          {t(($) => $.connected.inviteDecline)}
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className='mt-2 text-slate-600'>{t(($) => $.connected.noPendingInvites)}</p>
            )}
          </Card>
        </div>

        {logLines.length > 0 ? (
          <Card className='mt-8 rounded-2xl border-slate-200 bg-white p-4'>
            <h3 className='font-display text-slate text-sm tracking-[0.2em] uppercase'>{t(($) => $.connected.relayPreview)}</h3>
            <ul className='mt-3 space-y-2 text-sm text-slate-700'>
              {logLines.map((line) => (
                <li className='rounded-lg bg-slate-50 px-3 py-2' key={line}>
                  {line}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </Card>
    </main>
  )
}
