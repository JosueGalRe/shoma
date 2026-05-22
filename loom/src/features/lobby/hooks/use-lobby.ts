import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { LcuHttpMethod, LcuPaths, type LcuLobbyPositionPreferencesBody } from '@shoma/protocol-contract'
import { profileIconQueryOptions, useLatestDdragonVersion } from '@/core/http/ddragon-client'
import { parseLobbyInvites, parseLobbySentInvites } from '@/core/lcu/parsers/lobby'
import { readDodgePenalty } from '@/core/lcu/parsers/queue'
import { useCancelQueue, useChangeRole, useInvitePlayer, useJoinQueue, useKickPlayer, usePromotePlayer, useSetPartyType } from '@/core/lcu/lcu-mutations'
import { createLcuQueryOptions, currentSummonerDescriptor, gameflowPhaseDescriptor, invitesDescriptor, lobbySessionDescriptor, queueDescriptor, queueSearchDescriptor, sentInvitesDescriptor } from '@/core/lcu/lcu-queries'
import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import { useSharedLCUTransport, useSharedRelayClient } from '@/core/relay/relay-client-provider'
import { RelayClientState } from '@/core/relay/relay-client'
import { type SummonerId as SummonerIdType } from '@/core/types/branded'
import { type GameMode } from '@/features/modes/mode-engine'

import { createLobbyViewModel, type CurrentSummonerPayload, type LobbyViewModelInputs } from '../view-model/lobby-view-model'
import { emptyLobbyQueueStatus, useStickyLobbyStore, type LobbyMember, type LobbyRolePreferences } from '../lobby-store'
import { LobbyActionError, parseCurrentSummonerPayload, readSummonerId, useLobbyGracePeriod, type UseLobbyResult } from './use-lobby-support'
export type { LobbyActions, UseLobbyResult } from './use-lobby-support'

export function useLobby(): UseLobbyResult {
  const [actionError, setActionError] = useState<string | null>(null)
  const [isActionPending, setIsActionPending] = useState(false)
  const { state: clientState } = useSharedRelayClient()
  const transport = useSharedLCUTransport()
  const isConnected = clientState === RelayClientState.CONNECTED
  const queryClient = useQueryClient()
  const currentSummonerQuery = useQuery(createLcuQueryOptions(currentSummonerDescriptor, transport))
  const parsedInvitesDescriptor = useMemo(() => ({ ...invitesDescriptor, parse: parseLobbyInvites }), [])
  const parsedSentInvitesDescriptor = useMemo(() => ({ ...sentInvitesDescriptor, parse: parseLobbySentInvites }), [])
  const lobbyQuery = useQuery(createLcuQueryOptions(lobbySessionDescriptor, transport))
  const gameflowQuery = useQuery(createLcuQueryOptions(gameflowPhaseDescriptor, transport))
  const queueQuery = useQuery(createLcuQueryOptions(queueDescriptor, transport))
  const queueSearchQuery = useQuery(createLcuQueryOptions(queueSearchDescriptor, transport))
  const invitesQuery = useQuery(createLcuQueryOptions(parsedInvitesDescriptor, transport))
  const sentInvitesQuery = useQuery(createLcuQueryOptions(parsedSentInvitesDescriptor, transport))
  useLcuObserverSync(lobbySessionDescriptor, transport)
  useLcuObserverSync(gameflowPhaseDescriptor, transport)
  useLcuObserverSync(queueDescriptor, transport)
  useLcuObserverSync(queueSearchDescriptor, transport)
  useLcuObserverSync(parsedInvitesDescriptor, transport)
  useLcuObserverSync(parsedSentInvitesDescriptor, transport)
  useLcuObserverSync(currentSummonerDescriptor, transport)
  const joinQueueMutation = useJoinQueue(transport, queryClient)
  const leaveQueueMutation = useCancelQueue(transport, queryClient)
  const invitePlayerMutation = useInvitePlayer(transport, queryClient)
  const promotePlayerMutation = usePromotePlayer(transport, queryClient)
  const kickPlayerMutation = useKickPlayer(transport, queryClient)
  const changeRoleMutation = useChangeRole(transport, queryClient)
  const setPartyTypeMutation = useSetPartyType(transport, queryClient)
  const setRolePreferencesMutation = useMutation({
    mutationFn: async (preferences: LobbyRolePreferences) => {
      if (!transport) throw new Error('No transport')
      await transport.request(LcuPaths.lobby.localMemberPositionPreferences, LcuHttpMethod.PUT, { firstPreference: preferences.first, secondPreference: preferences.second })
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lcu', 'lobby'] }) },
  })
  const isInvitingRef = useRef(false)
  const isPromotingRef = useRef(false)
  const isKickingRef = useRef(false)
  const isChangingRoleRef = useRef(false)
  const isSettingPartyTypeRef = useRef(false)
  const stickyStore = useStickyLobbyStore
  const [stickyMembers, setStickyMembersState] = useState<LobbyMember[]>(() => stickyStore.getState().stickyMembers)
  const [stickyMode, setStickyModeState] = useState<GameMode>(() => stickyStore.getState().stickyMode)
  const ddragonVersion = useLatestDdragonVersion()
  const gameflowPhase = gameflowQuery.data ?? null
  const queueStatus = queueQuery.data ?? emptyLobbyQueueStatus
  const isLobbyGracePeriodActive = useLobbyGracePeriod(queueStatus.isSearching)
  const lobbyMembers = lobbyQuery.data?.members ?? null
  const partyType = lobbyQuery.data?.partyType ?? null
  const lookupMembers = lobbyMembers ?? stickyMembers
  const summonerIds = useMemo(() => Array.from(new Set(lookupMembers.map((member) => member.summonerId))).sort((left, right) => left - right), [lookupMembers])
  const summonersQuery = useQuery({
    queryKey: ['lcu', 'lobby', 'summoners', summonerIds] as const,
    queryFn: async () => {
      if (!transport) throw new Error('No transport')
      const entries = await Promise.all(summonerIds.map(async (summonerId): Promise<[SummonerIdType, CurrentSummonerPayload | null]> => {
        try {
          const result = await transport.request(LcuPaths.summoner.summoner(summonerId))
          return [summonerId, parseCurrentSummonerPayload(result?.content)]
        } catch {
          return [summonerId, null]
        }
      }))
      return Object.fromEntries(entries.filter((entry): entry is [SummonerIdType, CurrentSummonerPayload] => entry[1] !== null))
    },
    enabled: Boolean(transport && isConnected && summonerIds.length > 0),
    staleTime: Infinity,
  })
  const profileIconIds = useMemo(() => Array.from(new Set(lookupMembers.flatMap((member) => {
    const summoner = summonersQuery.data?.[member.summonerId] ?? null
    const profileIconId = member.profileIconId ?? summoner?.profileIconId ?? null
    return profileIconId === null || profileIconId < 0 ? [] : [profileIconId]
  }))).sort((left, right) => left - right), [lookupMembers, summonersQuery.data])
  const profileIconQueries = useQueries({ queries: profileIconIds.map((iconId) => ({ ...profileIconQueryOptions(ddragonVersion.data ?? '', iconId), enabled: ddragonVersion.isSuccess })) })
  const iconUrls = useMemo(() => Object.fromEntries(profileIconIds.map((iconId, index) => [iconId, profileIconQueries[index]?.data ?? null])) as Record<number, string | null>, [profileIconIds, profileIconQueries])

  useEffect(() => stickyStore.subscribe((state) => { setStickyMembersState(state.stickyMembers); setStickyModeState(state.stickyMode) }), [stickyStore])
  useEffect(() => {
    if (gameflowPhase === 'None' || gameflowPhase === 'ChampSelect') { stickyStore.getState().clearStickyLobby(); return }
    if (lobbyMembers?.length) { stickyStore.getState().setStickyMembers(lobbyMembers) }
    if (lobbyMembers?.length && lobbyQuery.data?.mode) stickyStore.getState().setStickyMode(lobbyQuery.data.mode)
  }, [gameflowPhase, lobbyMembers, lobbyQuery.data?.mode, stickyStore])

  const viewModelInputs = useMemo<LobbyViewModelInputs>(() => ({ gameflowPhase, lobbyMembers, liveLobbyMode: lobbyQuery.data?.mode ?? null, stickyMembers, stickyMode, queueStatus, isLobbyGracePeriodActive, currentSummoner: parseCurrentSummonerPayload(currentSummonerQuery.data), summonersById: summonersQuery.data ?? {}, iconUrls, invites: invitesQuery.data ?? null, partyType, dodgePenalty: readDodgePenalty(queueSearchQuery.data ?? null), isConnected, sentInvites: sentInvitesQuery.data ?? null }), [currentSummonerQuery.data, gameflowPhase, iconUrls, invitesQuery.data, isConnected, isLobbyGracePeriodActive, lobbyMembers, lobbyQuery.data?.mode, partyType, queueSearchQuery.data, queueStatus, sentInvitesQuery.data, stickyMembers, stickyMode, summonersQuery.data])
  const viewModel = useMemo(() => createLobbyViewModel(viewModelInputs), [viewModelInputs])

  const sendAction = useCallback(async (errorKey: string, action: () => Promise<unknown>) => {
    if (!transport || !isConnected) { setActionError('lobby.errors.clientNotConnected'); return }
    setActionError(null); setIsActionPending(true)
    try { await action() } catch (error) { setActionError(error instanceof LobbyActionError ? error.errorKey : errorKey) } finally { setIsActionPending(false) }
  }, [isConnected, transport])
  const handleInvite = useCallback(async (summonerId: SummonerIdType) => { if (isInvitingRef.current) return Promise.resolve(); isInvitingRef.current = true; try { return await invitePlayerMutation.mutateAsync(summonerId) } finally { isInvitingRef.current = false } }, [invitePlayerMutation])
  const handlePromote = useCallback(async (summonerId: SummonerIdType) => { if (isPromotingRef.current) return Promise.resolve(); isPromotingRef.current = true; try { return await promotePlayerMutation.mutateAsync(summonerId) } finally { isPromotingRef.current = false } }, [promotePlayerMutation])
  const handleKick = useCallback(async (summonerId: SummonerIdType) => { if (isKickingRef.current) return Promise.resolve(); isKickingRef.current = true; try { return await kickPlayerMutation.mutateAsync(summonerId) } finally { isKickingRef.current = false } }, [kickPlayerMutation])
  const handleChangeRole = useCallback(async (body: LcuLobbyPositionPreferencesBody) => { if (isChangingRoleRef.current) return Promise.resolve(); isChangingRoleRef.current = true; try { return await changeRoleMutation.mutateAsync(body) } finally { isChangingRoleRef.current = false } }, [changeRoleMutation])
  const handleSetPartyType = useCallback(async (partyType: string) => { if (isSettingPartyTypeRef.current) return Promise.resolve(); isSettingPartyTypeRef.current = true; try { return await setPartyTypeMutation.mutateAsync(partyType) } finally { isSettingPartyTypeRef.current = false } }, [setPartyTypeMutation])

  return {
    actionError,
    actions: {
      changeRole: async (slot, role) => { await sendAction('lobby.errors.changeRoleFailed', () => handleChangeRole({ firstPreference: slot === 'first' ? role : viewModel.rolePreferences.first, secondPreference: slot === 'second' ? role : viewModel.rolePreferences.second })) },
      invitePlayer: async (summonerName) => {
        const normalizedName = summonerName.trim()
        if (!normalizedName) { setActionError('lobby.errors.enterSummonerName'); return }
        if (!viewModel.canInvite) { setActionError('lobby.errors.noInvitePermission'); return }
        await sendAction('lobby.errors.invitePlayerFailed', async () => {
          if (!transport) throw new Error('No transport')
          const lookup = await transport.request(LcuPaths.summoner.summonersByName(normalizedName))
          const summonerId = readSummonerId(lookup?.content)
          if (lookup?.status !== 200 || summonerId === null) throw new LobbyActionError('lobby.errors.summonerNotFound')
          await handleInvite(summonerId)
        })
      },
      joinQueue: () => sendAction('lobby.errors.joinQueueFailed', () => joinQueueMutation.mutateAsync()),
      kickPlayer: (member) => !viewModel.isOwner ? (setActionError('lobby.errors.onlyOwnerCanKick'), Promise.resolve()) : sendAction('lobby.errors.kickPlayerFailed', () => handleKick(member.summonerId)),
      leaveQueue: () => sendAction('lobby.errors.leaveQueueFailed', () => leaveQueueMutation.mutateAsync()),
      promotePlayer: (member) => !viewModel.isOwner ? (setActionError('lobby.errors.onlyOwnerCanPromote'), Promise.resolve()) : sendAction('lobby.errors.promotePlayerFailed', () => handlePromote(member.summonerId)),
      setRolePreferences: async (preferences) => { await sendAction('lobby.errors.changeRoleFailed', () => setRolePreferencesMutation.mutateAsync(preferences)) },
      setPartyType: async (partyType) => { await sendAction('lobby.errors.setPartyTypeFailed', () => handleSetPartyType(partyType)) },
    },
    isActionPending,
    isConnected,
    isLoading: lobbyQuery.isLoading || queueQuery.isLoading || queueSearchQuery.isLoading || invitesQuery.isLoading || sentInvitesQuery.isLoading,
    isLobbyFetching: lobbyQuery.isFetching,
    isLobbyLoading: lobbyQuery.isLoading,
    isSettingPartyType: setPartyTypeMutation.isPending,
    viewModel,
  }
}
