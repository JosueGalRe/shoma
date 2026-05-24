import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { profileIconQueryOptions, useLatestDdragonVersion } from '@/core/http/ddragon-client'
import {
  useCancelQueue,
  useChangeRole,
  useInvitePlayer,
  useJoinQueue,
  useKickPlayer,
  usePromotePlayer,
  useSetPartyType,
} from '@/core/lcu/lcu-mutations'
import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import {
  createLcuQueryOptions,
  currentSummonerDescriptor,
  gameflowPhaseDescriptor,
  invitesDescriptor,
  lobbySessionDescriptor,
  queueDescriptor,
  queueSearchDescriptor,
  sentInvitesDescriptor,
} from '@/core/lcu/lcu-queries'
import { parseLobbyInvites, parseLobbySentInvites } from '@/core/lcu/parsers/lobby'
import { readDodgePenalty } from '@/core/lcu/parsers/queue'
import { RelayClientState } from '@/core/relay/relay-client'
import { useSharedLCUTransport, useSharedRelayClient } from '@/core/relay/relay-client-provider'
import type { SummonerId as SummonerIdType } from '@/core/types/branded'
import type { GameMode } from '@/features/modes/mode-engine'
import { LcuHttpMethod, LcuPaths } from '@shoma/protocol-contract'
import type { LcuLobbyPositionPreferencesBody } from '@shoma/protocol-contract'

import { emptyLobbyQueueStatus, useStickyLobbyStore } from '../lobby-store'
import type { LobbyMember } from '../lobby-store'
import type { LobbyRolePreferences } from '../lobby-store'
import { createLobbyViewModel } from '../view-model/lobby-view-model'
import type { CurrentSummonerPayload } from '../view-model/lobby-view-model'
import type { LobbyViewModelInputs } from '../view-model/lobby-view-model'
import { LobbyActionError, parseCurrentSummonerPayload, readSummonerId, useLobbyGracePeriod } from './use-lobby-support'
import type { UseLobbyResult } from './use-lobby-support'
export type { LobbyActions, UseLobbyResult } from './use-lobby-support'

export function useLobby(): UseLobbyResult {
  const [actionError, setActionError] = useState<string | null>(null)
  const [isActionPending, setIsActionPending] = useState(false)
  const { state: clientState } = useSharedRelayClient()
  const transport = useSharedLCUTransport()
  const isConnected = clientState === RelayClientState.CONNECTED
  const queryClient = useQueryClient()
  const currentSummonerQuery = useQuery(createLcuQueryOptions(currentSummonerDescriptor, transport))
  const parsedInvitesDescriptor = useMemo(() => {
    return { ...invitesDescriptor, parse: parseLobbyInvites }
  }, [])
  const parsedSentInvitesDescriptor = useMemo(() => {
    return { ...sentInvitesDescriptor, parse: parseLobbySentInvites }
  }, [])
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
  const joinQueueMutation = useJoinQueue()
  const leaveQueueMutation = useCancelQueue()
  const invitePlayerMutation = useInvitePlayer()
  const promotePlayerMutation = usePromotePlayer()
  const kickPlayerMutation = useKickPlayer()
  const changeRoleMutation = useChangeRole()
  const setPartyTypeMutation = useSetPartyType()
  const setRolePreferencesMutation = useMutation({
    mutationFn: async (preferences: LobbyRolePreferences) => {
      if (!transport) {
        throw new Error('No transport')
      }
      await transport.request(LcuPaths.lobby.localMemberPositionPreferences, LcuHttpMethod.PUT, {
        firstPreference: preferences.first,
        secondPreference: preferences.second,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['lcu', 'lobby'] })
    },
  })
  const isInvitingRef = useRef(false)
  const isPromotingRef = useRef(false)
  const isKickingRef = useRef(false)
  const isChangingRoleRef = useRef(false)
  const isSettingPartyTypeRef = useRef(false)
  const stickyStore = useStickyLobbyStore
  const [stickyMembers, setStickyMembersState] = useState<LobbyMember[]>(() => {
    return stickyStore.getState().stickyMembers
  })
  const [stickyMode, setStickyModeState] = useState<GameMode>(() => {
    return stickyStore.getState().stickyMode
  })
  const [lobbyCreationTime, setLobbyCreationTimeState] = useState<number | null>(() => {
    return stickyStore.getState().lobbyCreationTime
  })
  const ddragonVersion = useLatestDdragonVersion()
  const gameflowPhase = gameflowQuery.data ?? null
  const queueStatus = queueQuery.data ?? emptyLobbyQueueStatus
  const isLobbyGracePeriodActive = useLobbyGracePeriod(queueStatus.isSearching)
  const lobbyMembers = lobbyQuery.data?.members ?? null
  const partyType = lobbyQuery.data?.partyType ?? null
  const lookupMembers = lobbyMembers ?? stickyMembers
  const summonerIds = useMemo(() => {
    return Array.from(
      new Set(
        lookupMembers.map((member) => {
          return member.summonerId
        }),
      ),
    ).sort((left, right) => {
      return left - right
    })
  }, [lookupMembers])
  const summonersQuery = useQuery({
    queryKey: ['lcu', 'lobby', 'summoners', summonerIds] as const,
    queryFn: async () => {
      if (!transport) {
        throw new Error('No transport')
      }
      const entries = await Promise.all(
        summonerIds.map(async (summonerId): Promise<[SummonerIdType, CurrentSummonerPayload | null]> => {
          try {
            const result = await transport.request(LcuPaths.summoner.summoner(summonerId))
            return [summonerId, parseCurrentSummonerPayload(result?.content)]
          } catch {
            return [summonerId, null]
          }
        }),
      )
      return Object.fromEntries(
        entries.filter((entry): entry is [SummonerIdType, CurrentSummonerPayload] => {
          return entry[1] !== null
        }),
      )
    },
    enabled: Boolean(transport && isConnected && summonerIds.length > 0),
    staleTime: Infinity,
  })
  const profileIconIds = useMemo(() => {
    return Array.from(
      new Set(
        lookupMembers.flatMap((member) => {
          const summoner = summonersQuery.data?.[member.summonerId] ?? null
          const profileIconId = member.profileIconId ?? summoner?.profileIconId ?? null
          return profileIconId === null || profileIconId < 0 ? [] : [profileIconId]
        }),
      ),
    ).sort((left, right) => {
      return left - right
    })
  }, [lookupMembers, summonersQuery.data])
  const profileIconQueries = useQueries({
    queries: profileIconIds.map((iconId) => {
      return {
        ...profileIconQueryOptions(ddragonVersion.data ?? '', iconId),
        enabled: ddragonVersion.isSuccess,
      }
    }),
  })
  const iconUrls = useMemo(() => {
    const nextIconUrls: Record<number, string | null> = {}

    profileIconIds.forEach((iconId, index) => {
      nextIconUrls[iconId] = profileIconQueries[index]?.data ?? null
    })

    return nextIconUrls
  }, [profileIconIds, profileIconQueries])

  useEffect(() => {
    return stickyStore.subscribe((state) => {
      setLobbyCreationTimeState(state.lobbyCreationTime)
      setStickyMembersState(state.stickyMembers)
      setStickyModeState(state.stickyMode)
    })
  }, [stickyStore])
  useEffect(() => {
    if (gameflowPhase === 'None' || gameflowPhase === 'ChampSelect' || gameflowPhase === 'InProgress') {
      stickyStore.getState().clearStickyLobby()
      return
    }
    const hasActiveLobby = Boolean(lobbyMembers?.length) || queueStatus.isSearching || isLobbyGracePeriodActive
    if (hasActiveLobby && lobbyCreationTime === null) {
      stickyStore.getState().setLobbyCreationTime(Date.now())
    } else if (!hasActiveLobby && lobbyCreationTime !== null) {
      stickyStore.getState().setLobbyCreationTime(null)
    }
    if (lobbyMembers?.length) {
      stickyStore.getState().setStickyMembers(lobbyMembers)
    }
    if (lobbyMembers?.length && lobbyQuery.data?.mode) {
      stickyStore.getState().setStickyMode(lobbyQuery.data.mode)
    }
  }, [
    gameflowPhase,
    isLobbyGracePeriodActive,
    lobbyCreationTime,
    lobbyMembers,
    lobbyQuery.data?.mode,
    queueStatus.isSearching,
    stickyStore,
  ])

  const viewModelInputs = useMemo<LobbyViewModelInputs>(() => {
    return {
      gameflowPhase,
      lobbyCreationTime,
      lobbyMembers,
      liveLobbyMode: lobbyQuery.data?.mode ?? null,
      stickyMembers,
      stickyMode,
      queueStatus,
      isLobbyGracePeriodActive,
      currentSummoner: parseCurrentSummonerPayload(currentSummonerQuery.data),
      summonersById: summonersQuery.data ?? {},
      iconUrls,
      invites: invitesQuery.data ?? null,
      partyType,
      dodgePenalty: readDodgePenalty(queueSearchQuery.data ?? null),
      isConnected,
      sentInvites: sentInvitesQuery.data ?? null,
    }
  }, [
    currentSummonerQuery.data,
    gameflowPhase,
    iconUrls,
    invitesQuery.data,
    isConnected,
    isLobbyGracePeriodActive,
    lobbyCreationTime,
    lobbyMembers,
    lobbyQuery.data?.mode,
    partyType,
    queueSearchQuery.data,
    queueStatus,
    sentInvitesQuery.data,
    stickyMembers,
    stickyMode,
    summonersQuery.data,
  ])
  const viewModel = useMemo(() => {
    return createLobbyViewModel(viewModelInputs)
  }, [viewModelInputs])

  const sendAction = useCallback(
    async (errorKey: string, action: () => Promise<unknown>) => {
      if (!transport || !isConnected) {
        setActionError('lobby.errors.clientNotConnected')
        return
      }
      setActionError(null)
      setIsActionPending(true)
      try {
        await action()
      } catch (error) {
        setActionError(error instanceof LobbyActionError ? error.errorKey : errorKey)
      } finally {
        setIsActionPending(false)
      }
    },
    [isConnected, transport],
  )
  const handleInvite = useCallback(
    async (summonerId: SummonerIdType) => {
      if (isInvitingRef.current) {
        return Promise.resolve()
      }
      isInvitingRef.current = true
      try {
        return await invitePlayerMutation.mutateAsync(summonerId)
      } finally {
        isInvitingRef.current = false
      }
    },
    [invitePlayerMutation],
  )
  const handlePromote = useCallback(
    async (summonerId: SummonerIdType) => {
      if (isPromotingRef.current) {
        return Promise.resolve()
      }
      isPromotingRef.current = true
      try {
        return await promotePlayerMutation.mutateAsync(summonerId)
      } finally {
        isPromotingRef.current = false
      }
    },
    [promotePlayerMutation],
  )
  const handleKick = useCallback(
    async (summonerId: SummonerIdType) => {
      if (isKickingRef.current) {
        return Promise.resolve()
      }
      isKickingRef.current = true
      try {
        return await kickPlayerMutation.mutateAsync(summonerId)
      } finally {
        isKickingRef.current = false
      }
    },
    [kickPlayerMutation],
  )
  const handleChangeRole = useCallback(
    async (body: LcuLobbyPositionPreferencesBody) => {
      if (isChangingRoleRef.current) {
        return Promise.resolve()
      }
      isChangingRoleRef.current = true
      try {
        return await changeRoleMutation.mutateAsync(body)
      } finally {
        isChangingRoleRef.current = false
      }
    },
    [changeRoleMutation],
  )
  const handleSetPartyType = useCallback(
    async (partyType: string) => {
      if (isSettingPartyTypeRef.current) {
        return Promise.resolve()
      }
      isSettingPartyTypeRef.current = true
      try {
        return await setPartyTypeMutation.mutateAsync(partyType)
      } finally {
        isSettingPartyTypeRef.current = false
      }
    },
    [setPartyTypeMutation],
  )

  return {
    actionError,
    actions: {
      changeRole: async (slot, role) => {
        await sendAction('lobby.errors.changeRoleFailed', () => {
          return handleChangeRole({
            firstPreference: slot === 'first' ? role : viewModel.rolePreferences.first,
            secondPreference: slot === 'second' ? role : viewModel.rolePreferences.second,
          })
        })
      },
      invitePlayer: async (summonerName) => {
        const normalizedName = summonerName.trim()
        if (!normalizedName) {
          setActionError('lobby.errors.enterSummonerName')
          return
        }
        if (!viewModel.canInvite) {
          setActionError('lobby.errors.noInvitePermission')
          return
        }
        await sendAction('lobby.errors.invitePlayerFailed', async () => {
          if (!transport) {
            throw new Error('No transport')
          }
          const lookup = await transport.request(LcuPaths.summoner.summonersByName(normalizedName))
          const summonerId = readSummonerId(lookup?.content)
          if (lookup?.status !== 200 || summonerId === null) {
            throw new LobbyActionError('lobby.errors.summonerNotFound')
          }
          await handleInvite(summonerId)
        })
      },
      joinQueue: () => {
        return sendAction('lobby.errors.joinQueueFailed', () => {
          return joinQueueMutation.mutateAsync()
        })
      },
      kickPlayer: (member) => {
        return !viewModel.isOwner
          ? (setActionError('lobby.errors.onlyOwnerCanKick'), Promise.resolve())
          : sendAction('lobby.errors.kickPlayerFailed', () => {
              return handleKick(member.summonerId)
            })
      },
      leaveQueue: () => {
        return sendAction('lobby.errors.leaveQueueFailed', () => {
          return leaveQueueMutation.mutateAsync()
        })
      },
      promotePlayer: (member) => {
        return !viewModel.isOwner
          ? (setActionError('lobby.errors.onlyOwnerCanPromote'), Promise.resolve())
          : sendAction('lobby.errors.promotePlayerFailed', () => {
              return handlePromote(member.summonerId)
            })
      },
      setRolePreferences: async (preferences) => {
        await sendAction('lobby.errors.changeRoleFailed', () => {
          return setRolePreferencesMutation.mutateAsync(preferences)
        })
      },
      setPartyType: async (partyType) => {
        await sendAction('lobby.errors.setPartyTypeFailed', () => {
          return handleSetPartyType(partyType)
        })
      },
    },
    isActionPending,
    isConnected,
    isLoading:
      lobbyQuery.isLoading ||
      queueQuery.isLoading ||
      queueSearchQuery.isLoading ||
      invitesQuery.isLoading ||
      sentInvitesQuery.isLoading,
    isLobbyFetching: lobbyQuery.isFetching,
    isLobbyLoading: lobbyQuery.isLoading,
    isSettingPartyType: setPartyTypeMutation.isPending,
    viewModel,
  }
}
