import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { RiftClientState } from '@core/rift/rift-client-types'
import { useRiftStore } from '@core/rift/rift-store'
import { ROLE_OPTIONS } from './-lobby-runes'
import { LobbyHeader } from './-components/LobbyHeader'
import { QueueCard } from './-components/QueueCard'
import { ReadyCheckCard } from './-components/ReadyCheckCard'
import { LobbyMembersCard } from './-components/LobbyMembersCard'
import { RolePreferencesCard } from './-components/RolePreferencesCard'
import { ConnectedFooterPanels } from './-components/footer-panels'
import type { LobbyMemberSnapshot } from './-lobby-types'
import { sendReadyCheckResponse } from './-lobby-interactions-utils'
import { useLobbyPlatformEffects } from './-hooks/lobby-platform-effects'
import { useLobbySocialActions } from './-hooks/lobby-social-actions'
import { useLobbyRuntimeResources } from './-hooks/lobby-runtime-resources'
import { formatRolePair, readSummonerData } from './-lobby-utils'
import { useConnectedUiStore } from './-lobby-store'
import { deriveLobbyQueueOptions } from './-lobby-utils'

export const Route = createFileRoute('/connected/lobby')({
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
    logLines,
    setPeer,
    appendLog,
  } = useRiftStore()
  const mapId = lobbyDetails?.mapId ?? null
  const {
    readyCheckPending,
    setReadyCheckPending,
    memberActionPendingById,
    setMemberActionPendingById,
    lobbyActionPending,
    setLobbyActionPending,
    selectedQueueId,
    setSelectedQueueId,
    inviteSubmissionPending,
    setInviteSubmissionPending,
    inviteName,
    setInviteName,
    firstRoleDraft,
    setFirstRoleDraft,
    secondRoleDraft,
    setSecondRoleDraft,
    roleUpdatePending,
    setRoleUpdatePending,
    installPromptAvailable,
    setInstallPromptAvailable,
    isStandaloneMode,
    setIsStandaloneMode,
  } = useConnectedUiStore()
  const { ddragonVersionValue, queueDodgePenaltySeconds, getMapName, getQueueDescription, lcuClient } =
    useLobbyRuntimeResources({
      i18nResolvedLanguage: i18n.resolvedLanguage,
      queueErrors: queueState?.errors,
      appendLog,
      client,
      setPeer,
      status,
    })

  const { readyCheckVisible, readyCheckResponded, showInstallPrompt } = useLobbyPlatformEffects({
    readyCheckState,
    appendLog,
    setInstallPromptAvailable,
    setIsStandaloneMode,
  })

  const { data: lobbyQueueOptions = [] } = useQuery({
    queryKey: ['lobby-queue-options'] as const,
    queryFn: async () => {
      try {
        const [enabledResponse, defaultResponse, queueCatalogResponse] = await Promise.all([
          lcuClient.platformConfig.getNamespaceKey('LcuSocial', 'EnabledGameQueues'),
          lcuClient.platformConfig.getNamespaceKey('LcuSocial', 'DefaultGameQueues'),
          lcuClient.gameQueues.getQueues(),
        ])

        if (queueCatalogResponse.status !== 200) {
          return []
        }

        return deriveLobbyQueueOptions(
          queueCatalogResponse.content,
          enabledResponse.status === 200 ? enabledResponse.content : null,
          defaultResponse.status === 200 ? defaultResponse.content : null,
        )
      } catch (error) {
        appendLog(`lobby queue options failed: ${String(error)}`)
        return []
      }
    },
    enabled: status === RiftClientState.CONNECTED,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (selectedQueueId || lobbyQueueOptions.length === 0) {
      return
    }

    setSelectedQueueId(String(lobbyQueueOptions[0].id))
  }, [lobbyQueueOptions, selectedQueueId, setSelectedQueueId])

  const [memberProfiles, setMemberProfiles] = useState<Record<number, { displayName: string | null; profileIconId: number | null }>>({})

  useEffect(() => {
    if (!lobbyDetails?.members?.length || status !== RiftClientState.CONNECTED) {
      setMemberProfiles({})
      return
    }

    let cancelled = false

    const members = lobbyDetails.members

    async function loadProfiles() {
      const profiles: Record<number, { displayName: string | null; profileIconId: number | null }> = {}

      for (const member of members) {
        if (cancelled) return
        try {
          const response = await lcuClient.summoner.getSummoner(member.summonerId)
          if (response.status === 200) {
            profiles[member.summonerId] = readSummonerData(response.content)
          } else {
            console.warn(`[Lobby] Summoner ${member.summonerId} returned status ${response.status}`)
            profiles[member.summonerId] = { displayName: null, profileIconId: null }
          }
        } catch (error) {
          console.error(`[Lobby] Failed to load summoner ${member.summonerId}:`, error)
          appendLog(`lobby member load failed: ${String(error)}`)
          profiles[member.summonerId] = { displayName: null, profileIconId: null }
        }
      }

      if (!cancelled) {
        setMemberProfiles(profiles)
      }
    }

    void loadProfiles()

    return () => {
      cancelled = true
    }
  }, [lobbyDetails?.members, status, lcuClient.summoner, appendLog])

  const lobbyMembers = useMemo(() => {
    const baseMembers = lobbyDetails?.members ?? []
    const snapshots: LobbyMemberSnapshot[] = baseMembers.map((member) => {
      const profile = memberProfiles[member.summonerId]
      return {
        ...member,
        displayName: profile?.displayName ?? member.displayName,
        profileIconId: profile?.profileIconId ?? member.profileIconId,
      }
    })

    snapshots.sort((left, right) => {
      if (left.isLocalMember && !right.isLocalMember) return -1
      if (!left.isLocalMember && right.isLocalMember) return 1
      return 0
    })

    return snapshots
  }, [lobbyDetails?.members, memberProfiles])

  const localLobbyMember = useMemo(() => {
    return lobbyMembers.find((member) => member.isLocalMember) ?? null
  }, [lobbyMembers])

  const {
    leaveQueue,
    leaveLobby,
    joinQueue,
    createLobby,
    promoteMember,
    kickMember,
    toggleMemberInvite,
    updateRoles,
  } = useLobbySocialActions({
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

  const localFirstPositionPreference = localLobbyMember?.firstPositionPreference
  const localSecondPositionPreference = localLobbyMember?.secondPositionPreference

  useEffect(() => {
    if (!localFirstPositionPreference || !localSecondPositionPreference) {
      return
    }

    if (firstRoleDraft !== localFirstPositionPreference) {
      setFirstRoleDraft(localFirstPositionPreference)
    }

    if (secondRoleDraft !== localSecondPositionPreference) {
      setSecondRoleDraft(localSecondPositionPreference)
    }
  }, [
    firstRoleDraft,
    localFirstPositionPreference,
    localSecondPositionPreference,
    secondRoleDraft,
    setFirstRoleDraft,
    setSecondRoleDraft,
  ])

  async function acceptReadyCheck() {
    await sendReadyCheckResponse({
      isConnected: status === RiftClientState.CONNECTED,
      readyCheckPending,
      action: () => lcuClient.matchmaking.acceptReadyCheck(),
      logMessage: 'ready check accept failed',
      setReadyCheckPending,
      appendLog,
    })
  }

  async function declineReadyCheck() {
    await sendReadyCheckResponse({
      isConnected: status === RiftClientState.CONNECTED,
      readyCheckPending,
      action: () => lcuClient.matchmaking.declineReadyCheck(),
      logMessage: 'ready check decline failed',
      setReadyCheckPending,
      appendLog,
    })
  }

  if (status !== RiftClientState.CONNECTED) {
    return (
      <main className='mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-5 py-10 sm:px-8'>
        <Card className='p-8 text-center'>
        <h1 className='font-display text-3xl text-primary'>{t(($) => $.connected.unavailableTitle)}</h1>
        <p className='mt-4 text-muted-foreground'>{t(($) => $.connected.unavailableBody)}</p>
          <Button asChild variant='default' className='mt-8 font-display tracking-wider uppercase'>
            <Link to='/'>{t(($) => $.connected.backToConnect)}</Link>
          </Button>
        </Card>
      </main>
    )
  }

  return (
    <main className='mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-5 py-10 sm:px-8'>
      <div className='space-y-6'>
        <LobbyHeader peerName={peerName} peerVersion={peerVersion} />

        <div className='grid gap-6 sm:grid-cols-2'>
          <QueueCard
            queueState={queueState}
            lobbyActionPending={lobbyActionPending}
            mapId={mapId}
            ddragonVersionValue={ddragonVersionValue}
            leaveQueue={leaveQueue}
          />

          <ReadyCheckCard
            readyCheckVisible={readyCheckVisible}
            readyCheckState={readyCheckState}
            readyCheckPending={readyCheckPending}
            readyCheckResponded={readyCheckResponded}
            acceptReadyCheck={acceptReadyCheck}
            declineReadyCheck={declineReadyCheck}
          />

          <LobbyMembersCard
            status={status}
            lobbyDetails={lobbyDetails}
            lobbyMembers={lobbyMembers}
            queueState={queueState}
            lobbyActionPending={lobbyActionPending}
            queueDodgePenaltySeconds={queueDodgePenaltySeconds}
            memberActionPendingById={memberActionPendingById}
            mapId={mapId}
            ddragonVersionValue={ddragonVersionValue}
            joinQueue={joinQueue}
            leaveLobby={leaveLobby}
            promoteMember={promoteMember}
            toggleMemberInvite={toggleMemberInvite}
            kickMember={kickMember}
            lobbyQueueOptions={lobbyQueueOptions}
            selectedQueueId={selectedQueueId}
            setSelectedQueueId={setSelectedQueueId}
            createLobby={createLobby}
          />

          <RolePreferencesCard
            lobbyDetails={lobbyDetails}
            localLobbyMember={localLobbyMember}
            firstRoleDraft={firstRoleDraft}
            setFirstRoleDraft={setFirstRoleDraft}
            secondRoleDraft={secondRoleDraft}
            setSecondRoleDraft={setSecondRoleDraft}
            roleUpdatePending={roleUpdatePending}
            updateRoles={updateRoles}
          />
        </div>

        <ConnectedFooterPanels
          installPromptAvailable={installPromptAvailable}
          installPromptBody={t(($) => $.connected.installPromptBody)}
          installPromptButton={t(($) => $.connected.installPromptButton)}
          installPromptHint={t(($) => $.connected.installPromptHint)}
          isStandaloneMode={isStandaloneMode}
          logLines={logLines}
          onShowInstallPrompt={() => {
            void showInstallPrompt()
          }}
          relayPreviewTitle={t(($) => $.connected.relayPreview)}
        />
      </div>
    </main>
  )
}
