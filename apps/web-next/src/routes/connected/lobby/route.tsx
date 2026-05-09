import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Award, Mail } from 'lucide-react'

import { BottomNav, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { useSharedLCUTransport } from '@/core/rift/rift-client-provider'
import { useCreateLobby, useDeleteLobby } from '@/core/lcu/lcu-mutations'
import { createLcuQueryOptions, gameQueuesDescriptor, platformConfigDescriptor } from '@/core/lcu/lcu-queries'
import { translateLcuError } from '@/features/diagnostics/eligibility-errors'
import { useLobby } from '@/features/lobby'
import { getModeNameKey, getModeRules } from '@/features/modes/mode-engine'
import { selectSwiftplayIsValid, useSwiftplayStore } from '@/features/swiftplay/swiftplay-store'

import { LobbyPlayScreen, type MappedQueueList } from './-components/lobby-play-screen'
import { LobbyHeader } from './-components/lobby-header'
import { LobbyQueueCard } from './-components/lobby-queue-card'
import { LobbyMembersStrip } from './-components/lobby-members-strip'
import { LobbyBottomSheets } from './-components/lobby-bottom-sheets'
import { LobbyInviteOverlay } from './-components/lobby-invite-overlay'

const EMPTY_QUEUES: MappedQueueList = {}

function LobbyRouteComponent() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const {
    actionError,
    actions,
    canInvite,
    dodgePenalty,
    invites,
    isActionPending,
    isConnected,
    isLoading,
    isOwner,
    members,
    mode,
    queueStatus,
    rolePreferences,
    sentInvites,
  } = useLobby()
  const [isInviteOverlayOpen, setIsInviteOverlayOpen] = useState(false)
  const [createLobbyError, setCreateLobbyError] = useState<string | null>(null)
  const [isRoleSheetOpen, setIsRoleSheetOpen] = useState(false)
  const [isInviteSheetOpen, setIsInviteSheetOpen] = useState(false)
  const isSwiftplay = mode === 'swiftplay'
  const isSwiftplayConfigured = useSwiftplayStore(selectSwiftplayIsValid)
  const modeRules = getModeRules(mode)
  const hasRequiredRoles = rolePreferences.first !== 'UNSELECTED' && rolePreferences.second !== 'UNSELECTED'
  const translatedActionError = actionError ? translateLcuError(actionError) : null
  const isDodgePenaltyActive = dodgePenalty > 0
  const canJoinQueue = isConnected && !isActionPending && !queueStatus.isSearching && !isDodgePenaltyActive && (!modeRules.requiresRoleSelection || hasRequiredRoles)
  const currentModeLabel = t(getModeNameKey(mode))
  const isInLobby = members.length > 0 || isLoading

  const transport = useSharedLCUTransport()

  const enabledQueuesQuery = useQuery(createLcuQueryOptions(platformConfigDescriptor('LcuSocial', 'EnabledGameQueues'), transport))
  const defaultQueuesQuery = useQuery(createLcuQueryOptions(platformConfigDescriptor('LcuSocial', 'DefaultGameQueues'), transport))

  const enabledGameQueues = useMemo(() => {
    if (!enabledQueuesQuery.data) return []
    return enabledQueuesQuery.data.split(',').map(Number)
  }, [enabledQueuesQuery.data])

  const defaultGameQueues = useMemo(() => {
    if (!defaultQueuesQuery.data) return []
    return defaultQueuesQuery.data.split(',').map(Number)
  }, [defaultQueuesQuery.data])

  const queuesQuery = useQuery({
    ...createLcuQueryOptions(gameQueuesDescriptor, transport),
    select: (queues): MappedQueueList => {
      if (!queues) return {}

      const ret: MappedQueueList = {}
      const enabledQueueIds = new Set(enabledGameQueues)
      const defaultQueueIndex = new Map(defaultGameQueues.map((id, index) => [id, index]))

      for (const queue of queues) {
        if (queue.category !== 'PvP') continue
        if (queue.queueAvailability !== 'Available' || !enabledQueueIds.has(queue.id)) continue

        const key = `${queue.mapId}-${queue.gameMode}`
        if (!ret[key]) ret[key] = []
        ret[key].push(queue)
      }

      for (const queues of Object.values(ret)) {
        queues.sort((a, b) => {
          const aDefaultIndex = defaultQueueIndex.get(a.id)
          const bDefaultIndex = defaultQueueIndex.get(b.id)

          if (aDefaultIndex !== undefined) {
            if (bDefaultIndex !== undefined) return aDefaultIndex - bDefaultIndex
            return -1
          }
          if (bDefaultIndex !== undefined) return 1
          return 0
        })
      }

      return ret
    },
  })
  const availableQueues = queuesQuery.data ?? EMPTY_QUEUES

  const sections = useMemo(() => {
    return Object.keys(availableQueues).sort((a, b) => {
      const [aMap, aGameMode] = a.split('-')
      const [bMap, bGameMode] = b.split('-')

      if (aMap === '11' && bMap !== '11') return -1
      if (bMap === '11') return 1
      if (aGameMode === 'CLASSIC' && bGameMode !== 'CLASSIC') return -1
      if (bGameMode === 'CLASSIC') return 1
      if (aGameMode === 'ARAM' && bGameMode !== 'ARAM') return -1
      if (bGameMode === 'ARAM') return 1
      return 0
    })
  }, [availableQueues])

  const createLobbyMutation = useCreateLobby(transport, queryClient)
  const deleteLobbyMutation = useDeleteLobby(transport, queryClient)

  const handleCreateLobby = async (queueId: number) => {
    try {
      setCreateLobbyError(null)
      if (isInLobby) {
        await deleteLobbyMutation.mutateAsync()
      }
      await createLobbyMutation.mutateAsync({ queueId })
    } catch (error) {
      setCreateLobbyError(error instanceof Error ? error.message : 'errors.generic')
    }
  }

  if (!isInLobby) {
    const isPlayScreenLoading = queuesQuery.isLoading || enabledQueuesQuery.isLoading || defaultQueuesQuery.isLoading

    return (
      <LobbyPlayScreen
        isPlayScreenLoading={isPlayScreenLoading}
        createLobbyError={createLobbyError}
        sections={sections}
        availableQueues={availableQueues}
        isCreateLobbyPending={createLobbyMutation.isPending}
        handleCreateLobby={handleCreateLobby}
      />
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <LobbyHeader
        isConnected={isConnected}
        currentModeLabel={currentModeLabel}
      />

      <LobbyQueueCard
        queueStatus={queueStatus}
        gameMode={{ isSwiftplay, isSwiftplayConfigured }}
        session={{ isConnected, isActionPending }}
        canJoinQueue={canJoinQueue}
        dodgePenalty={{ isActive: isDodgePenaltyActive, remainingSeconds: dodgePenalty }}
        onJoinQueue={actions.joinQueue}
        onLeaveQueue={actions.leaveQueue}
      />

      {/* Action Error */}
      {actionError ? (
        <div className="shrink-0 px-4">
          <Card className="border-red-700 bg-red-950/40" aria-live="polite">
            <CardHeader className="py-2">
              <CardTitle className="text-sm">{t('errors.generic')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs pb-3">
              <p className="text-red-200">{translatedActionError ? t(translatedActionError.messageKey) : t(actionError, { defaultValue: actionError })}</p>
              {translatedActionError ? (
                <p className="text-red-300">
                  {translatedActionError.affectedSummoner ? `${translatedActionError.affectedSummoner}: ` : ''}
                  {t(translatedActionError.actionKey)}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <LobbyMembersStrip
        members={members}
        modeRules={modeRules}
        sessionState={{
          isOwner,
          isLoading,
          isConnected,
          isActionPending,
        }}
        onPromotePlayer={actions.promotePlayer}
        onKickPlayer={actions.kickPlayer}
      />

      {/* Invite Player Button - compact inline */}
      <section className="shrink-0 px-4 py-2">
        <Button 
          className="w-full" 
          disabled={!isConnected || isActionPending || !canInvite} 
          onClick={() => setIsInviteOverlayOpen(true)} 
          variant="primary"
          size="sm"
        >
          {t('lobby.inviteOverlay.open')}
        </Button>
        {!canInvite ? <p className="mt-1 text-[10px] text-lol-text-muted text-center">{t('lobby.invitePermission')}</p> : null}
      </section>

      {/* Spacer to push BottomNav to bottom */}
      <div className="flex-1" />

      <BottomNav
        items={[
          {
            id: 'roles',
            label: t('lobby.bottomNav.rolePreferences'),
            icon: <Award className="size-4 text-lol-text-secondary" />,
            onClick: () => setIsRoleSheetOpen(true),
          },
          {
            id: 'invites',
            label: t('lobby.bottomNav.invites'),
            icon: <Mail className="size-4 text-lol-text-secondary" />,
            badge: invites.length,
            onClick: () => setIsInviteSheetOpen(true),
          },
        ]}
      />

      <LobbyBottomSheets
        sheets={{
          isRoleSheetOpen,
          setIsRoleSheetOpen,
          isInviteSheetOpen,
          setIsInviteSheetOpen,
        }}
        modeRules={modeRules}
        session={{ isConnected, isActionPending }}
        rolePreferences={rolePreferences}
        onChangeRole={actions.changeRole}
        invites={invites}
        sentInvites={sentInvites}
      />

      <LobbyInviteOverlay
        isInviteOverlayOpen={isInviteOverlayOpen}
        setIsInviteOverlayOpen={setIsInviteOverlayOpen}
        permissions={{ canInvite, isActionPending, isConnected }}
        onInvitePlayer={actions.invitePlayer}
      />
    </div>
  )
}


export const Route = createFileRoute('/connected/lobby')({
  loader: async ({ context }) => {
    const [riftModule, lcuModule] = await Promise.all([
      import('@/core/rift/route-loader'),
      import('@/core/lcu/lcu-queries'),
    ])
    const { ensureLcuRouteData } = riftModule
    const { gameQueuesDescriptor, platformConfigDescriptor } = lcuModule
    await ensureLcuRouteData(context.queryClient, [
      gameQueuesDescriptor,
      platformConfigDescriptor('LcuSocial', 'EnabledGameQueues'),
      platformConfigDescriptor('LcuSocial', 'DefaultGameQueues'),
    ])
  },
  component: LobbyRouteComponent,
})
