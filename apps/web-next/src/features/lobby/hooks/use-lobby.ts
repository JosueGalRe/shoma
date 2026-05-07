import { useCallback, useMemo, useRef, useState } from 'react'
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'

import { LcuPaths, type LcuLobbyPositionPreferencesBody } from '@mimic/protocol-contract'

import { profileIconQueryOptions, useLatestDdragonVersion } from '@/core/http/ddragon-client'
import { finiteNumber, parseObjectOrNull } from '@/core/lcu/parsers/base'
import { parseLobbyInvites, parseLobbyMembers, parseLobbyMode, parseLobbySentInvites, readDisplayName } from '@/core/lcu/parsers/lobby'
import { readDodgePenalty } from '@/core/lcu/parsers/queue'
import { useCancelQueue, useChangeRole, useInvitePlayer, useJoinQueue, useKickPlayer, usePromotePlayer } from '@/core/lcu/lcu-mutations'
import { createLcuQueryOptions, currentSummonerDescriptor, invitesDescriptor, lobbyDescriptor, queueDescriptor, queueSearchDescriptor, sentInvitesDescriptor } from '@/core/lcu/lcu-queries'
import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import { useSharedLCUTransport, useSharedRiftClient } from '@/core/rift/rift-client-provider'
import { RiftClientState } from '@/core/rift/rift-client'
import { SummonerId, type SummonerId as SummonerIdType } from '@/core/types/branded'
import { type GameMode } from '@/features/modes/mode-engine'

import {
  defaultLobbyRolePreferences,
  emptyLobbyQueueStatus,
  type LobbyInvite,
  type LobbyMember,
  type LobbyQueueStatus,
  type LobbyRole,
  type LobbyRolePreferences,
  type LobbySentInvite,
} from '../lobby-store'

const CurrentSummonerPayloadSchema = v.object({
  accountId: v.fallback(v.optional(finiteNumber), undefined),
  displayName: v.fallback(v.optional(v.string()), undefined),
  gameName: v.fallback(v.optional(v.string()), undefined),
  name: v.fallback(v.optional(v.string()), undefined),
  profileIconId: v.fallback(v.optional(finiteNumber), undefined),
  summonerId: v.fallback(v.optional(finiteNumber), undefined),
  tagLine: v.fallback(v.optional(v.string()), undefined),
})

type CurrentSummonerPayload = Omit<v.InferOutput<typeof CurrentSummonerPayloadSchema>, 'accountId' | 'summonerId'> & {
  summonerId?: SummonerIdType
}

type ParsedLobby = ReturnType<typeof parseLobbyMembers> & {
  mode: GameMode
}

class LobbyActionError extends Error {
  constructor(readonly errorKey: string) {
    super(errorKey)
  }
}

type LobbyActions = {
  changeRole: (slot: keyof LobbyRolePreferences, role: LobbyRole) => Promise<void>
  invitePlayer: (summonerName: string) => Promise<void>
  joinQueue: () => Promise<void>
  kickPlayer: (member: LobbyMember) => Promise<void>
  leaveQueue: () => Promise<void>
  promotePlayer: (member: LobbyMember) => Promise<void>
}

export type UseLobbyResult = {
  actionError: string | null
  actions: LobbyActions
  canInvite: boolean
  dodgePenalty: number
  invites: LobbyInvite[]
  isActionPending: boolean
  isConnected: boolean
  isLoading: boolean
  isOwner: boolean
  members: LobbyMember[]
  mode: GameMode
  queueStatus: LobbyQueueStatus
  rolePreferences: LobbyRolePreferences
  sentInvites: LobbySentInvite[]
}

function getLocalRolePreferences(members: LobbyMember[]): LobbyRolePreferences {
  const localMember = members.find((member) => member.isLocalMember)
  if (!localMember) {
    return defaultLobbyRolePreferences
  }

  return {
    first: localMember.firstPositionPreference,
    second: localMember.secondPositionPreference,
  }
}

function readSummonerId(content: unknown): SummonerIdType | null {
  const summoner = parseObjectOrNull(CurrentSummonerPayloadSchema, content)
  const summonerId = summoner?.summonerId ?? summoner?.accountId
  return summonerId === undefined ? null : SummonerId(summonerId)
}

function parseCurrentSummonerPayload(content: unknown): CurrentSummonerPayload | null {
  const summoner = parseObjectOrNull(CurrentSummonerPayloadSchema, content)
  if (!summoner) {
    return null
  }

  return {
    displayName: summoner.displayName,
    gameName: summoner.gameName,
    name: summoner.name,
    profileIconId: summoner.profileIconId,
    summonerId: readSummonerId(summoner) ?? undefined,
    tagLine: summoner.tagLine,
  }
}

export function useLobby(): UseLobbyResult {
  const [actionError, setActionError] = useState<string | null>(null)
  const [isActionPending, setIsActionPending] = useState(false)

  const { state: clientState } = useSharedRiftClient()
  const transport = useSharedLCUTransport()
  const isConnected = clientState === RiftClientState.CONNECTED
  const queryClient = useQueryClient()

  const currentSummonerQuery = useQuery(createLcuQueryOptions(currentSummonerDescriptor, transport))
  const currentSummoner = currentSummonerQuery.data
  const currentSummonerId = useMemo(() => readSummonerId(currentSummoner), [currentSummoner])
  const parsedLobbyDescriptor = useMemo(
    () => ({
      ...lobbyDescriptor,
      queryKey: [...lobbyDescriptor.queryKey, 'summoner', currentSummonerId] as const,
      parse: (content: unknown): ParsedLobby => ({
        ...parseLobbyMembers(content, {}, currentSummoner ?? null),
        mode: parseLobbyMode(content),
      }),
    }),
    [currentSummoner, currentSummonerId],
  )
  const parsedInvitesDescriptor = useMemo(
    () => ({
      ...invitesDescriptor,
      parse: parseLobbyInvites,
    }),
    [],
  )
  const parsedSentInvitesDescriptor = useMemo(
    () => ({
      ...sentInvitesDescriptor,
      parse: parseLobbySentInvites,
    }),
    [],
  )
  const lobbyQuery = useQuery(createLcuQueryOptions(parsedLobbyDescriptor, transport))
  const queueQuery = useQuery(createLcuQueryOptions(queueDescriptor, transport))
  const queueSearchQuery = useQuery(createLcuQueryOptions(queueSearchDescriptor, transport))
  const invitesQuery = useQuery(createLcuQueryOptions(parsedInvitesDescriptor, transport))
  const sentInvitesQuery = useQuery(createLcuQueryOptions(parsedSentInvitesDescriptor, transport))
  useLcuObserverSync(parsedLobbyDescriptor, transport)
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
  const isInvitingRef = useRef(false)
  const isPromotingRef = useRef(false)
  const isKickingRef = useRef(false)
  const isChangingRoleRef = useRef(false)
  const ddragonVersion = useLatestDdragonVersion()

  const lobbyContent = lobbyQuery.data
  const queueContent = queueQuery.data
  const queueSearchState = queueSearchQuery.data ?? null
  const invitesContent = invitesQuery.data
  const sentInvitesContent = sentInvitesQuery.data
  const mode = lobbyContent?.mode ?? 'normal-draft'
  const parsedMembers = useMemo(() => lobbyContent?.members ?? [], [lobbyContent?.members])
  const summonerIds = useMemo(() => Array.from(new Set(parsedMembers.map((member) => member.summonerId))).sort((left, right) => left - right), [parsedMembers])
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

      return Object.fromEntries(entries.filter((entry): entry is [SummonerIdType, CurrentSummonerPayload] => entry[1] !== null))
    },
    enabled: Boolean(transport && isConnected && summonerIds.length > 0),
    staleTime: Infinity,
  })

  const membersWithSummoners = useMemo(() => {
    const summoners = summonersQuery.data ?? {}

    return parsedMembers.map((member) => {
      const summoner = summoners[member.summonerId] ?? null
      const enrichedName = summoner ? readDisplayName(summoner) : member.displayName
      const enrichedIconId = summoner?.profileIconId ?? null

      return {
        ...member,
        displayName: member.displayName === 'Unknown summoner' ? enrichedName : member.displayName,
        profileIconId: member.profileIconId ?? enrichedIconId,
      }
    })
  }, [parsedMembers, summonersQuery.data])

  const profileIconIds = useMemo(
    () => Array.from(new Set(membersWithSummoners.flatMap((member) => (member.profileIconId === null ? [] : [member.profileIconId])))).sort((left, right) => left - right),
    [membersWithSummoners],
  )
  const profileIconQueries = useQueries({
    queries: profileIconIds.map((iconId) => ({
      ...profileIconQueryOptions(ddragonVersion.data ?? '', iconId),
      enabled: ddragonVersion.isSuccess,
    })),
  })
  const iconUrls = useMemo(
    () =>
      Object.fromEntries(
        profileIconIds.map((iconId, index) => [iconId, profileIconQueries[index]?.data ?? null]),
      ) as Record<string, string | null>,
    [profileIconIds, profileIconQueries],
  )

  const members = useMemo(() => {
    return membersWithSummoners.map((member) => ({
      ...member,
      iconUrl: member.profileIconId === null ? member.iconUrl : (iconUrls[member.profileIconId] ?? member.iconUrl),
    }))
  }, [iconUrls, membersWithSummoners])
  const isOwner = Boolean(members.find((member) => member.isLocalMember)?.isLeader)
  const rolePreferences = useMemo(() => getLocalRolePreferences(members), [members])
  const queueStatus = queueContent ?? emptyLobbyQueueStatus
  const dodgePenalty = readDodgePenalty(queueSearchState)
  const invites = invitesContent ?? []
  const sentInvites = sentInvitesContent ?? []
  const localMember = members.find((member) => member.isLocalMember) ?? null
  const canInvite = isOwner || Boolean(localMember?.allowedInviteOthers)

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

  const joinQueue = useCallback(
    () => sendAction('lobby.errors.joinQueueFailed', () => joinQueueMutation.mutateAsync()),
    [joinQueueMutation, sendAction],
  )

  const leaveQueue = useCallback(
    () => sendAction('lobby.errors.leaveQueueFailed', () => leaveQueueMutation.mutateAsync()),
    [leaveQueueMutation, sendAction],
  )

  const invitePlayer = useCallback(
    async (summonerName: string) => {
      const normalizedName = summonerName.trim()
      if (!normalizedName) {
        setActionError('lobby.errors.enterSummonerName')
        return
      }

      if (!canInvite) {
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
    [canInvite, handleInvite, sendAction, transport],
  )

  const promotePlayer = useCallback(
    (member: LobbyMember) => {
      if (!isOwner) {
        setActionError('lobby.errors.onlyOwnerCanPromote')
        return Promise.resolve()
      }

      return sendAction('lobby.errors.promotePlayerFailed', () => handlePromote(member.summonerId))
    },
    [handlePromote, isOwner, sendAction],
  )

  const kickPlayer = useCallback(
    (member: LobbyMember) => {
      if (!isOwner) {
        setActionError('lobby.errors.onlyOwnerCanKick')
        return Promise.resolve()
      }

      return sendAction('lobby.errors.kickPlayerFailed', () => handleKick(member.summonerId))
    },
    [handleKick, isOwner, sendAction],
  )

  const changeRole = useCallback(
    async (slot: keyof LobbyRolePreferences, role: LobbyRole) => {
      await sendAction('lobby.errors.changeRoleFailed', () =>
        handleChangeRole({
          firstPreference: slot === 'first' ? role : rolePreferences.first,
          secondPreference: slot === 'second' ? role : rolePreferences.second,
        }),
      )
    },
    [handleChangeRole, rolePreferences, sendAction],
  )

  return {
    actionError,
    actions: {
      changeRole,
      invitePlayer,
      joinQueue,
      kickPlayer,
      leaveQueue,
      promotePlayer,
    },
    canInvite,
    dodgePenalty,
    invites,
    isActionPending,
    isConnected,
    isLoading: lobbyQuery.isLoading || queueQuery.isLoading || queueSearchQuery.isLoading || invitesQuery.isLoading || sentInvitesQuery.isLoading,
    isOwner,
    members,
    mode,
    queueStatus,
    rolePreferences,
    sentInvites,
  }
}
