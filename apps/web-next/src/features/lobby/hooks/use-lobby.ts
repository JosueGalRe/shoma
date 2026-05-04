import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { LcuPaths, type LcuLobbyPositionPreferencesBody } from '@mimic/protocol-contract'

import { getProfileIconUrl, useLatestDdragonVersion } from '@/core/http/ddragon-client'
import { useCancelQueue, useChangeRole, useInvitePlayer, useJoinQueue, useKickPlayer, usePromotePlayer } from '@/core/lcu/lcu-mutations'
import { createLcuQueryOptions, currentSummonerDescriptor, invitesDescriptor, lobbyDescriptor, queueDescriptor } from '@/core/lcu/lcu-queries'
import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import { useLCUTransport, useRiftClient } from '@/core/rift/hooks'
import { RiftClientState } from '@/core/rift/rift-client'
import { useRiftStore } from '@/core/state/rift-store'
import { resolveGameMode, type GameMode } from '@/features/modes/mode-engine'

import {
  defaultLobbyRolePreferences,
  emptyLobbyQueueStatus,
  lobbyRoles,
  useLobbyStore,
  type LobbyInvite,
  type LobbyMember,
  type LobbyQueueStatus,
  type LobbyRole,
  type LobbyRolePreferences,
} from '../lobby-store'

type SummonerLookupPayload = {
  accountId?: number
  displayName?: string
  gameName?: string
  name?: string
  profileIconId?: number
  summonerId?: number
  tagLine?: string
}

type CurrentSummonerPayload = {
  displayName?: string
  gameName?: string
  name?: string
  profileIconId?: number
  summonerId?: number
  tagLine?: string
}

type ParsedLobby = ReturnType<typeof parseLobbyMembers> & {
  mode: GameMode
}

type PendingMutation<TPayload> = {
  payload: TPayload
  reject: (error: unknown) => void
  resolve: () => void
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
  invites: LobbyInvite[]
  isActionPending: boolean
  isConnected: boolean
  isLoading: boolean
  isOwner: boolean
  members: LobbyMember[]
  mode: GameMode
  queueStatus: LobbyQueueStatus
  rolePreferences: LobbyRolePreferences
}

function readObject(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function readBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
}

function readRole(value: unknown): LobbyRole {
  if (typeof value !== 'string') {
    return 'UNSELECTED'
  }

  return lobbyRoles.includes(value as LobbyRole) ? (value as LobbyRole) : 'UNSELECTED'
}

function readDisplayName(candidate: Record<string, unknown>): string {
  const baseName =
    readString(candidate.displayName) ??
    readString(candidate.gameName) ??
    readString(candidate.name) ??
    readString(candidate.summonerName) ??
    'Unknown summoner'
  const tagLine = readString(candidate.tagLine)

  return tagLine && !baseName.includes('#') ? `${baseName}#${tagLine}` : baseName
}

function parseLobbyMembers(
  content: unknown,
  iconUrls: Record<number, string | null>,
  currentSummoner: Record<string, unknown> | null,
): { members: LobbyMember[], localSummonerId: number | null } {
  const candidate = readObject(content)
  const rawMembers = Array.isArray(candidate?.members) ? candidate.members : []
  const localMemberPayload = readObject(candidate?.localMember)
  const localSummonerId = readNumber(localMemberPayload?.summonerId)

  const members = rawMembers
    .map((entry): LobbyMember | null => {
      const member = readObject(entry)
      if (!member) {
        return null
      }

      const summonerId = readNumber(member.summonerId)
      if (summonerId === null) {
        return null
      }

      const isLocalMember = (readBoolean(member.isLocalMember) ?? false) || summonerId === localSummonerId
      const profileIconId = readNumber(member.summonerIconId) ?? readNumber(member.profileIconId)
      let displayName = readDisplayName(member)

      if (displayName === 'Unknown summoner' && isLocalMember && currentSummoner) {
        displayName = readDisplayName(currentSummoner)
      }

      return {
        allowedInviteOthers: readBoolean(member.allowedInviteOthers) ?? false,
        displayName,
        firstPositionPreference: readRole(member.firstPositionPreference),
        iconUrl: iconUrls[summonerId] ?? null,
        isLeader: readBoolean(member.isLeader) ?? false,
        isLocalMember,
        profileIconId,
        secondPositionPreference: readRole(member.secondPositionPreference),
        summonerId,
      }
    })
    .filter((member): member is LobbyMember => member !== null)
    .sort((left, right) => {
      if (left.isLocalMember && !right.isLocalMember) return -1
      if (!left.isLocalMember && right.isLocalMember) return 1
      if (left.isLeader && !right.isLeader) return -1
      if (!left.isLeader && right.isLeader) return 1
      return left.displayName.localeCompare(right.displayName)
    })

  return { members, localSummonerId }
}

function parseLobbyMode(content: unknown): GameMode {
  const candidate = readObject(content)
  const gameConfig = readObject(candidate?.gameConfig)

  return resolveGameMode({
    gameMode: readString(gameConfig?.gameMode),
    mapId: readNumber(gameConfig?.mapId),
    queueId: readNumber(gameConfig?.queueId),
  })
}

function parseLobbyInvites(content: unknown): LobbyInvite[] {
  if (!Array.isArray(content)) {
    return []
  }

  return content
    .map((entry): LobbyInvite | null => {
      const invite = readObject(entry)
      if (!invite) {
        return null
      }

      const id = readString(invite.invitationId) ?? readString(invite.id)
      if (!id) {
        return null
      }

      return {
        fromSummonerId: readNumber(invite.fromSummonerId),
        fromSummonerName: readString(invite.fromSummonerName) ?? readString(invite.fromSummonerDisplayName) ?? 'Unknown summoner',
        id,
        state: readString(invite.state),
      }
    })
    .filter((invite): invite is LobbyInvite => invite !== null)
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

function readSummonerId(content: unknown): number | null {
  const summoner = readObject(content) as SummonerLookupPayload | null
  return readNumber(summoner?.summonerId) ?? readNumber(summoner?.accountId)
}

export function useLobby(): UseLobbyResult {
  const code = useRiftStore((state) => state.code)
  const riftStatus = useRiftStore((state) => state.status)
  const members = useLobbyStore((state) => state.members)
  const queueStatus = useLobbyStore((state) => state.queueStatus)
  const invites = useLobbyStore((state) => state.invites)
  const rolePreferences = useLobbyStore((state) => state.rolePreferences)
  const isOwner = useLobbyStore((state) => state.isOwner)
  const setMembers = useLobbyStore((state) => state.setMembers)
  const setQueueStatus = useLobbyStore((state) => state.setQueueStatus)
  const setInvites = useLobbyStore((state) => state.setInvites)
  const setRolePreferences = useLobbyStore((state) => state.setRolePreferences)
  const setIsOwner = useLobbyStore((state) => state.setIsOwner)
  const updateRole = useLobbyStore((state) => state.updateRole)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isActionPending, setIsActionPending] = useState(false)
  const [iconUrls, setIconUrls] = useState<Record<number, string | null>>({})
  const [pendingInvite, setPendingInvite] = useState<PendingMutation<number> | null>(null)
  const [pendingPromote, setPendingPromote] = useState<PendingMutation<number> | null>(null)
  const [pendingKick, setPendingKick] = useState<PendingMutation<number> | null>(null)
  const [pendingRoleChange, setPendingRoleChange] = useState<PendingMutation<LcuLobbyPositionPreferencesBody> | null>(null)

  const clientOptions = useMemo(
    () => ({
      code,
      enabled: code.length > 0 && riftStatus !== 'idle' && riftStatus !== 'error',
    }),
    [code, riftStatus],
  )
  const { client, state: clientState } = useRiftClient(clientOptions)
  const transport = useLCUTransport(client)
  const isConnected = clientState === RiftClientState.CONNECTED
  const queryClient = useQueryClient()

  const currentSummonerQuery = useQuery(createLcuQueryOptions(currentSummonerDescriptor, transport))
  const currentSummoner = currentSummonerQuery.data
  const parsedLobbyDescriptor = useMemo(
    () => ({
      ...lobbyDescriptor,
      parse: (content: unknown): ParsedLobby => ({
        ...parseLobbyMembers(content, iconUrls, currentSummoner ?? null),
        mode: parseLobbyMode(content),
      }),
    }),
    [currentSummoner, iconUrls],
  )
  const parsedInvitesDescriptor = useMemo(
    () => ({
      ...invitesDescriptor,
      parse: parseLobbyInvites,
    }),
    [],
  )
  const lobbyQuery = useQuery(createLcuQueryOptions(parsedLobbyDescriptor, transport))
  const queueQuery = useQuery(createLcuQueryOptions(queueDescriptor, transport))
  const invitesQuery = useQuery(createLcuQueryOptions(parsedInvitesDescriptor, transport))
  useLcuObserverSync(parsedLobbyDescriptor, transport)
  useLcuObserverSync(queueDescriptor, transport)
  useLcuObserverSync(parsedInvitesDescriptor, transport)
  useLcuObserverSync(currentSummonerDescriptor, transport)

  const joinQueueMutation = useJoinQueue(transport, queryClient)
  const leaveQueueMutation = useCancelQueue(transport, queryClient)
  const invitePlayerMutation = useInvitePlayer(transport, queryClient, pendingInvite?.payload ?? 0)
  const promotePlayerMutation = usePromotePlayer(transport, queryClient, pendingPromote?.payload ?? 0)
  const kickPlayerMutation = useKickPlayer(transport, queryClient, pendingKick?.payload ?? 0)
  const changeRoleMutation = useChangeRole(
    transport,
    queryClient,
    pendingRoleChange?.payload ?? {
      firstPreference: rolePreferences.first,
      secondPreference: rolePreferences.second,
    },
  )
  const ddragonVersion = useLatestDdragonVersion()

  const lobbyContent = lobbyQuery.data
  const queueContent = queueQuery.data
  const invitesContent = invitesQuery.data
  const mode = lobbyContent?.mode ?? 'normal-draft'
  const localMember = members.find((member) => member.isLocalMember) ?? null
  const canInvite = isOwner || Boolean(localMember?.allowedInviteOthers)

  useEffect(() => {
    const parsedMembers = lobbyContent?.members ?? []
    setMembers(parsedMembers)
    setIsOwner(Boolean(parsedMembers.find((member) => member.isLocalMember)?.isLeader))
    setRolePreferences(getLocalRolePreferences(parsedMembers))
  }, [lobbyContent, setIsOwner, setMembers, setRolePreferences])

  const [summonerCache, setSummonerCache] = useState<Record<number, CurrentSummonerPayload>>({})

  useEffect(() => {
    const localTransport = transport
    if (!localTransport || !isConnected || members.length === 0) {
      return
    }
    const requestSummoner = localTransport.request.bind(localTransport)

    const missingSummonerIds = members
      .filter((member) => !summonerCache[member.summonerId])
      .map((member) => member.summonerId)

    if (missingSummonerIds.length === 0) {
      return
    }

    let cancelled = false

    async function loadSummoners() {
      const loaded: Record<number, CurrentSummonerPayload> = {}
      for (const summonerId of missingSummonerIds) {
        try {
          const result = await requestSummoner(LcuPaths.summoner.summoner(summonerId))
          if (result?.content) {
            loaded[summonerId] = result.content as CurrentSummonerPayload
          }
        } catch {
          console.warn(`Failed to load summoner ${summonerId}`)
        }
      }

      if (!cancelled && Object.keys(loaded).length > 0) {
        setSummonerCache((current) => ({ ...current, ...loaded }))
      }
    }

    void loadSummoners()

    return () => {
      cancelled = true
    }
  }, [isConnected, members, summonerCache, transport])

  useEffect(() => {
    if (Object.keys(summonerCache).length === 0) {
      return
    }

    const currentMembers = useLobbyStore.getState().members
    const updatedMembers = currentMembers.map((member) => {
      const summonerData = summonerCache[member.summonerId]
      if (!summonerData) {
        return member
      }

      const summoner = readObject(summonerData)
      if (!summoner) {
        return member
      }

      const enrichedName = readDisplayName(summoner)
      const enrichedIconId = readNumber(summoner.profileIconId)

      return {
        ...member,
        displayName: member.displayName === 'Unknown summoner' ? enrichedName : member.displayName,
        profileIconId: member.profileIconId ?? enrichedIconId,
      }
    })

    setMembers(updatedMembers)
  }, [summonerCache, setMembers])

  useEffect(() => {
    if (Object.keys(iconUrls).length === 0) {
      return
    }

    const currentMembers = useLobbyStore.getState().members
    const updatedMembers = currentMembers.map((member) => ({
      ...member,
      iconUrl: iconUrls[member.summonerId] ?? member.iconUrl,
    }))

    setMembers(updatedMembers)
  }, [iconUrls, setMembers])

  useEffect(() => {
    setQueueStatus(queueContent ?? emptyLobbyQueueStatus)
  }, [queueContent, setQueueStatus])

  useEffect(() => {
    setInvites(invitesContent ?? [])
  }, [invitesContent, setInvites])

  useEffect(() => {
    if (!ddragonVersion.data) {
      return
    }

    let cancelled = false
    const membersToLoad = members.filter((member) => member.profileIconId !== null && iconUrls[member.summonerId] === undefined)

    if (membersToLoad.length === 0) {
      return
    }

    async function loadIcons() {
      const loadedEntries: Array<[number, string | null]> = []
      for (const member of membersToLoad) {
        if (member.profileIconId === null) {
          continue
        }

        try {
          loadedEntries.push([member.summonerId, await getProfileIconUrl(ddragonVersion.data ?? '', member.profileIconId)])
        } catch {
          loadedEntries.push([member.summonerId, null])
        }
      }

      if (!cancelled && loadedEntries.length > 0) {
        setIconUrls((current) => ({ ...current, ...Object.fromEntries(loadedEntries) }))
      }
    }

    void loadIcons()

    return () => {
      cancelled = true
    }
  }, [ddragonVersion.data, iconUrls, members])

  useEffect(() => {
    if (!pendingInvite) {
      return
    }

    invitePlayerMutation
      .mutateAsync()
      .then(() => pendingInvite.resolve())
      .catch(pendingInvite.reject)
      .finally(() => setPendingInvite(null))
  }, [pendingInvite])

  useEffect(() => {
    if (!pendingPromote) {
      return
    }

    promotePlayerMutation
      .mutateAsync()
      .then(() => pendingPromote.resolve())
      .catch(pendingPromote.reject)
      .finally(() => setPendingPromote(null))
  }, [pendingPromote])

  useEffect(() => {
    if (!pendingKick) {
      return
    }

    kickPlayerMutation
      .mutateAsync()
      .then(() => pendingKick.resolve())
      .catch(pendingKick.reject)
      .finally(() => setPendingKick(null))
  }, [pendingKick])

  useEffect(() => {
    if (!pendingRoleChange) {
      return
    }

    changeRoleMutation
      .mutateAsync()
      .then(() => pendingRoleChange.resolve())
      .catch(pendingRoleChange.reject)
      .finally(() => setPendingRoleChange(null))
  }, [pendingRoleChange])

  const runPendingMutation = useCallback(<TPayload,>(setPending: (pending: PendingMutation<TPayload>) => void, payload: TPayload) => {
    return new Promise<void>((resolve, reject) => {
      setPending({ payload, reject, resolve })
    })
  }, [])

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

        await runPendingMutation(setPendingInvite, summonerId)
      })
    },
    [canInvite, runPendingMutation, sendAction, transport],
  )

  const promotePlayer = useCallback(
    (member: LobbyMember) => {
      if (!isOwner) {
        setActionError('lobby.errors.onlyOwnerCanPromote')
        return Promise.resolve()
      }

      return sendAction('lobby.errors.promotePlayerFailed', () => runPendingMutation(setPendingPromote, member.summonerId))
    },
    [isOwner, runPendingMutation, sendAction],
  )

  const kickPlayer = useCallback(
    (member: LobbyMember) => {
      if (!isOwner) {
        setActionError('lobby.errors.onlyOwnerCanKick')
        return Promise.resolve()
      }

      return sendAction('lobby.errors.kickPlayerFailed', () => runPendingMutation(setPendingKick, member.summonerId))
    },
    [isOwner, runPendingMutation, sendAction],
  )

  const changeRole = useCallback(
    async (slot: keyof LobbyRolePreferences, role: LobbyRole) => {
      updateRole(slot, role)
      const nextPreferences = { ...rolePreferences, [slot]: role }
      await sendAction('lobby.errors.changeRoleFailed', () =>
        runPendingMutation(setPendingRoleChange, {
          firstPreference: nextPreferences.first,
          secondPreference: nextPreferences.second,
        }),
      )
    },
    [rolePreferences, runPendingMutation, sendAction, updateRole],
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
    invites,
    isActionPending,
    isConnected,
    isLoading: lobbyQuery.isLoading || queueQuery.isLoading || invitesQuery.isLoading,
    isOwner,
    members,
    mode,
    queueStatus,
    rolePreferences,
  }
}
