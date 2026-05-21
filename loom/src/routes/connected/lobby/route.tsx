import { createFileRoute, useSearch } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Award, Mail } from 'lucide-react'

import { BottomNav, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { translateLcuError } from '@/features/diagnostics/eligibility-errors'
import { useLobby } from '@/features/lobby'
import { useSharedLCUTransport } from '@/core/relay/relay-client-provider'
import { getModeNameKey, getModeRules } from '@/features/modes/mode-engine'
import { selectSwiftplayIsValid, useSwiftplayStore } from '@/features/swiftplay/swiftplay-store'
import { ensureLcuRouteData } from '@/core/relay/route-loader'
import { uiStoreSelectors, useUiStore } from '@/core/state/ui-store'
import {
  createLcuQueryOptions,
  currentSummonerDescriptor,
  gameQueuesDescriptor,
  gameflowPhaseDescriptor,
  invitesDescriptor,
  lobbySessionDescriptor,
  platformConfigDescriptor,
  queueDescriptor,
  queueSearchDescriptor,
  sentInvitesDescriptor,
} from '@/core/lcu/lcu-queries'

import { Lock } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { PrototypeSwitcher } from '@/components/prototype-switcher'
import { VariantA } from './-components/prototype-variants/variant-a'
import { VariantB } from './-components/prototype-variants/variant-b'
import { VariantC } from './-components/prototype-variants/variant-c'
import { LobbyBottomSheets } from './-components/lobby-bottom-sheets'
import { LobbyInviteOverlay } from './-components/lobby-invite-overlay'
import { LobbyCreationContent } from '@/features/lobby/components/lobby-creation-content'
import { PremadeReadyCheckOverlay } from '@/features/ready-check/components/premade-ready-check-overlay'

function LobbyRouteComponent() {
  const { t } = useTranslation()
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
  } = useLobby()
  const setLobbyInviteOverlayOpen = useUiStore(uiStoreSelectors.setLobbyInviteOverlayOpen)
  const setLobbyInviteSheetOpen = useUiStore(uiStoreSelectors.setLobbyInviteSheetOpen)
  const setLobbyRoleSheetOpen = useUiStore(uiStoreSelectors.setLobbyRoleSheetOpen)
  const isSwiftplay = mode === 'swiftplay'
  const transport = useSharedLCUTransport()
  const gameflowPhaseQuery = useQuery(createLcuQueryOptions(gameflowPhaseDescriptor, transport))
  const gameflowPhase = gameflowPhaseQuery.data ?? null
  const [isLobbyGracePeriodActive, setIsLobbyGracePeriodActive] = useState(false)
  const previousIsSearchingRef = useRef(queueStatus.isSearching)
  const lobbyGraceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const wasSearching = previousIsSearchingRef.current
    previousIsSearchingRef.current = queueStatus.isSearching

    const shouldClear = gameflowPhase === 'None' || gameflowPhase === 'ChampSelect' || queueStatus.isSearching

    if (shouldClear) {
      if (lobbyGraceTimerRef.current) {
        clearTimeout(lobbyGraceTimerRef.current)
        lobbyGraceTimerRef.current = null
      }
      setIsLobbyGracePeriodActive(false)
    }

    if (!shouldClear && wasSearching) {
      setIsLobbyGracePeriodActive(true)

      lobbyGraceTimerRef.current = setTimeout(() => {
        lobbyGraceTimerRef.current = null
        setIsLobbyGracePeriodActive(false)
      }, 3_000)
    }

    return () => {
      if (lobbyGraceTimerRef.current) {
        clearTimeout(lobbyGraceTimerRef.current)
        lobbyGraceTimerRef.current = null
      }
    }
  }, [gameflowPhase, queueStatus.isSearching])

  useEffect(() => {
    return () => {
      if (lobbyGraceTimerRef.current) {
        clearTimeout(lobbyGraceTimerRef.current)
        lobbyGraceTimerRef.current = null
      }
    }
  }, [])

  const isSwiftplayConfigured = useSwiftplayStore(selectSwiftplayIsValid)
  const modeRules = getModeRules(mode)
  const hasRequiredRoles = rolePreferences.first !== 'UNSELECTED' && (rolePreferences.first === 'FILL' || rolePreferences.second !== 'UNSELECTED')
  const translatedActionError = actionError ? translateLcuError(actionError) : null
  const isDodgePenaltyActive = dodgePenalty > 0
  const canJoinQueue = isConnected && !isActionPending && !queueStatus.isSearching && !isDodgePenaltyActive && (!modeRules.requiresRoleSelection || hasRequiredRoles)
  const currentModeLabel = t(getModeNameKey(mode))
  const hasLobby = members.length > 0 || queueStatus.isSearching || isLobbyGracePeriodActive
  const search = useSearch({ from: '/connected/lobby' })
  const variant = (search as Record<string, unknown>).variant as string | undefined ?? 'A'

  if (!hasLobby) {
    return <LobbyCreationContent />
  }

  const variantProps = {
    members,
    queueStatus,
    canJoinQueue,
    onJoinQueue: actions.joinQueue,
    onLeaveQueue: actions.leaveQueue,
    isConnected,
    isActionPending,
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title={t('lobby.title')}
        badges={[
          { label: t('lobby.closed'), icon: <Lock className="size-3" /> },
          { label: currentModeLabel },
        ]}
      />

      {variant === 'A' && <VariantA {...variantProps} />}
      {variant === 'B' && <VariantB {...variantProps} />}
      {variant === 'C' && <VariantC {...variantProps} />}

      <PrototypeSwitcher />

      <LobbyBottomSheets />

      <LobbyInviteOverlay />
      <PremadeReadyCheckOverlay isSwiftplay={isSwiftplay} />
    </div>
  )
}

export const Route = createFileRoute('/connected/lobby')({
  component: LobbyRouteComponent,
  loader: async ({ context }) => {
    await ensureLcuRouteData(context.queryClient, [
      lobbySessionDescriptor,
      queueDescriptor,
      queueSearchDescriptor,
      invitesDescriptor,
      sentInvitesDescriptor,
      currentSummonerDescriptor,
      gameQueuesDescriptor,
      platformConfigDescriptor('LcuSocial', 'EnabledGameQueues'),
      platformConfigDescriptor('LcuSocial', 'DefaultGameQueues'),
    ])
  },
})
