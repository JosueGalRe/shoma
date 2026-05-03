import { Link, createFileRoute } from '@tanstack/react-router'
import { useQueries, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { InvitePanel } from '@/routes/connected/lobby/-components/InvitePanel'
import { ConnectedReceivedInvitesCard } from '@/routes/connected/lobby/-components/received-invites-card'
import { useLobbyRuntimeResources } from '@/routes/connected/lobby/-hooks/lobby-runtime-resources'
import { useLobbySocialActions } from '@/routes/connected/lobby/-hooks/lobby-social-actions'
import { sendInviteResponse } from '@/routes/connected/lobby/-lobby-interactions-utils'
import { useConnectedUiStore } from '@/routes/connected/lobby/-lobby-store'
import type { InviteDetailsById, LobbyMemberSnapshot } from '@/routes/connected/lobby/-lobby-types'
import { buildSummonerIconUrl, readSuggestedPlayers, readSummonerData } from '@/routes/connected/lobby/-lobby-utils'
import { RiftClientState } from '@core/rift/rift-client-types'
import { useRiftStore } from '@core/rift/rift-store'

export const Route = createFileRoute('/connected/invites')({
  component: ConnectedInvitesRoute,
})

function ConnectedInvitesRoute() {
  const { i18n, t } = useTranslation()
  const { status, client, lobbyDetails, invites, setPeer, appendLog } = useRiftStore()
  const {
    inviteActionPendingById,
    setInviteActionPendingById,
    memberActionPendingById,
    setMemberActionPendingById,
    lobbyActionPending,
    setLobbyActionPending,
    selectedQueueId,
    inviteName,
    setInviteName,
    inviteSubmissionPending,
    setInviteSubmissionPending,
    firstRoleDraft,
    secondRoleDraft,
    roleUpdatePending,
    setRoleUpdatePending,
    showInvitePanel,
    setShowInvitePanel,
  } = useConnectedUiStore()
  const lobbyRuntimeResources = useLobbyRuntimeResources({
    i18nResolvedLanguage: i18n.resolvedLanguage,
    queueErrors: undefined,
    appendLog,
    client,
    setPeer,
    status,
  })
  const { ddragonVersionValue, queueDodgePenaltySeconds, lcuClient } = lobbyRuntimeResources
  const { getMapName, getQueueDescription } = lobbyRuntimeResources

  const pendingInvites = useMemo(() => {
    return invites.filter((invite) => invite.state === 'Pending')
  }, [invites])

  const inviteDetailQueries = useMemo(() => {
    return pendingInvites.map((invite) => {
      return {
        queryKey: ['invite-detail', invite.invitationId, invite.fromSummonerId, invite.gameConfig.queueId, invite.gameConfig.mapId] as const,
        queryFn: async () => {
          try {
            const summonerResponse = await lcuClient.summoner.getSummoner(invite.fromSummonerId)
            const summonerData =
              summonerResponse.status === 200
                ? readSummonerData(summonerResponse.content)
                : { displayName: null, profileIconId: null }

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
  }, [appendLog, getMapName, getQueueDescription, lcuClient.summoner, pendingInvites, status])

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

  const localLobbyMember = useMemo<LobbyMemberSnapshot | null>(() => {
    const member = lobbyDetails?.members.find((candidate) => candidate.isLocalMember) ?? null
    if (!member) {
      return null
    }

    return {
      ...member,
      displayName: null,
      profileIconId: null,
    }
  }, [lobbyDetails?.members])

  const canInviteOthers = Boolean(localLobbyMember?.allowedInviteOthers)

  const { inviteSummoner, inviteByName } = useLobbySocialActions({
    status,
    lcuClient,
    appendLog,
    lobbyActionPending,
    setLobbyActionPending,
    selectedQueueId,
    queueDodgePenaltySeconds,
    memberActionPendingById,
    setMemberActionPendingById,
    inviteSubmissionPending,
    setInviteSubmissionPending,
    inviteName,
    setInviteName,
    roleUpdatePending,
    setRoleUpdatePending,
    firstRoleDraft,
    secondRoleDraft,
    localLobbyMember,
    unknownSummonerLabel: t(($) => $.connected.unknownSummoner),
    leaveLobbyConfirmMessage: t(($) => $.connected.leaveLobbyConfirm),
    buildPromoteConfirmMessage(displayName) {
      return t(($) => $.connected.promoteConfirm, { value: displayName })
    },
    buildKickConfirmMessage(displayName) {
      return t(($) => $.connected.kickConfirm, { value: displayName })
    },
    confirm(message) {
      return window.confirm(message)
    },
  })

  const { data: suggestedPlayers = [] } = useQuery({
    queryKey: ['suggested-players'] as const,
    queryFn: async () => {
      try {
        const response = await lcuClient.suggestedPlayers.getSuggestedPlayers()
        if (response.status !== 200) {
          return []
        }

        return readSuggestedPlayers(response.content)
      } catch (error) {
        appendLog(`suggested players load failed: ${String(error)}`)
        return []
      }
    },
    enabled: status === RiftClientState.CONNECTED && showInvitePanel && canInviteOthers,
    staleTime: 30_000,
  })

  const [shareCopied, setShareCopied] = useState(false)
  const shareCopiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (shareCopiedTimeoutRef.current) {
        clearTimeout(shareCopiedTimeoutRef.current)
      }
    }
  }, [])

  const handleShare = async () => {
    const shareUrl = window.location.origin
    const shareData = {
      title: 'Mimic',
      text: 'Join me on Mimic!',
      url: shareUrl,
    }

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData)
        return
      } catch (error) {
        console.error('Share failed:', error)
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareCopied(true)
      if (shareCopiedTimeoutRef.current) {
        clearTimeout(shareCopiedTimeoutRef.current)
      }
      shareCopiedTimeoutRef.current = setTimeout(() => {
        setShareCopied(false)
        shareCopiedTimeoutRef.current = null
      }, 2000)
    } catch (error) {
      console.error('Clipboard write failed:', error)
    }
  }

  if (status !== RiftClientState.CONNECTED) {
    return (
      <Card className='p-8 text-center'>
        <h1 className='font-display text-3xl text-primary'>{t(($) => $.connected.unavailableTitle)}</h1>
        <p className='mt-4 text-muted-foreground'>{t(($) => $.connected.unavailableBody)}</p>
        <Button asChild variant='default' className='mt-8 font-display tracking-wider uppercase'>
          <Link to='/'>{t(($) => $.connected.backToConnect)}</Link>
        </Button>
      </Card>
    )
  }

  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col px-5 py-8 sm:px-8'>
      <div className='mb-6 flex items-center justify-between'>
        <h2 className='font-display text-2xl text-primary'>{t(($) => $.connected.invites)}</h2>
        <Button
          variant='outline'
          className='font-display tracking-wider uppercase'
          onClick={handleShare}
          type='button'
        >
          {shareCopied ? t(($) => $.connected.copied) : t(($) => $.connected.inviteFriends)}
        </Button>
      </div>
      <div className='grid gap-6 sm:grid-cols-2'>
        <InvitePanel
          canInviteOthers={canInviteOthers}
          showInvitePanel={showInvitePanel}
          setShowInvitePanel={setShowInvitePanel}
          inviteName={inviteName}
          setInviteName={setInviteName}
          inviteSubmissionPending={inviteSubmissionPending}
          inviteByName={inviteByName}
          suggestedPlayers={suggestedPlayers}
          inviteSummoner={inviteSummoner}
        />

        <ConnectedReceivedInvitesCard
          buildSummonerIconUrl={(profileIconId) => buildSummonerIconUrl(ddragonVersionValue, profileIconId)}
          formatInviteDetailsLabel={(map, queue) =>
            t(($) => $.connected.inviteDetailsValue, {
              map: String(map ?? t(($) => $.connected.unknown)),
              queue: String(queue ?? t(($) => $.connected.unknown)),
            })
          }
          inviteAcceptLabel={t(($) => $.connected.inviteAccept)}
          inviteActionPendingById={inviteActionPendingById}
          inviteDeclineLabel={t(($) => $.connected.inviteDecline)}
          inviteDetailsById={inviteDetailsById}
          noPendingInvitesLabel={t(($) => $.connected.noPendingInvites)}
          onRespond={(invitationId, action) => {
            void sendInviteResponse({
              invitationId,
              action,
              isConnected: status === RiftClientState.CONNECTED,
              inviteActionPendingById,
              lcuClient,
              setInviteActionPendingById,
              appendLog,
            })
          }}
          pendingInvites={pendingInvites}
          title={t(($) => $.connected.invites)}
          unknownLabel={t(($) => $.connected.unknown)}
          unknownSummonerLabel={t(($) => $.connected.unknownSummoner)}
        />
      </div>
    </main>
  )
}
