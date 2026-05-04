import { useCallback, useEffect, useMemo, useState } from 'react'
import { LcuHttpMethod, LcuPaths } from '@mimic/protocol-contract'

import { getProfileIconUrl, useLatestDdragonVersion } from '@/core/http/ddragon-client'
import { useLCUObserver, useLCURequest, useLCUTransport, useRiftClient } from '@/core/rift/hooks'
import { RiftClientState } from '@/core/rift/rift-client'
import { useRiftStore } from '@/core/state/rift-store'

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

type LobbyPayload = {
  members?: unknown[]
}

type SummonerLookupPayload = {
  accountId?: number
  displayName?: string
  gameName?: string
  name?: string
  profileIconId?: number
  summonerId?: number
  tagLine?: string
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

function parseLobbyMembers(content: unknown, iconUrls: Record<number, string | null>): LobbyMember[] {
  const candidate = readObject(content)
  const members = Array.isArray(candidate?.members) ? candidate.members : []

  return members
    .map((entry): LobbyMember | null => {
      const member = readObject(entry)
      if (!member) {
        return null
      }

      const summonerId = readNumber(member.summonerId)
      if (summonerId === null) {
        return null
      }

      const profileIconId = readNumber(member.profileIconId)

      return {
        allowedInviteOthers: readBoolean(member.allowedInviteOthers) ?? false,
        displayName: readDisplayName(member),
        firstPositionPreference: readRole(member.firstPositionPreference),
        iconUrl: iconUrls[summonerId] ?? null,
        isLeader: readBoolean(member.isLeader) ?? false,
        isLocalMember: readBoolean(member.isLocalMember) ?? false,
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
}

function parseQueueStatus(content: unknown, status: number | null): LobbyQueueStatus {
  if (status === 404 || content === null || content === undefined) {
    return emptyLobbyQueueStatus
  }

  const candidate = readObject(content)
  if (!candidate) {
    return emptyLobbyQueueStatus
  }

  const searchState = readString(candidate.searchState) ?? readString(candidate.state)
  const queueId = readNumber(candidate.queueId) ?? readNumber(readObject(candidate.lobby)?.queueId)

  return {
    isSearching: Boolean(searchState && searchState !== 'Invalid' && searchState !== 'Error'),
    queueId,
    searchState,
  }
}

function parseInvites(content: unknown): LobbyInvite[] {
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

  const lobbyRequest = useLCURequest<LobbyPayload>(transport, LcuPaths.lobby.lobby)
  const lobbyObserver = useLCUObserver<LobbyPayload>(transport, LcuPaths.lobby.lobby)
  const queueRequest = useLCURequest(transport, LcuPaths.matchmaking.search)
  const queueObserver = useLCUObserver(transport, LcuPaths.matchmaking.search)
  const invitesRequest = useLCURequest(transport, LcuPaths.lobby.receivedInvitations)
  const invitesObserver = useLCUObserver(transport, LcuPaths.lobby.receivedInvitations)
  const ddragonVersion = useLatestDdragonVersion()

  const lobbyContent = lobbyObserver.data?.content ?? lobbyRequest.data
  const queueContent = queueObserver.data?.content ?? queueRequest.data
  const queueHttpStatus = queueObserver.data?.status ?? null
  const invitesContent = invitesObserver.data?.content ?? invitesRequest.data
  const localMember = members.find((member) => member.isLocalMember) ?? null
  const canInvite = isOwner || Boolean(localMember?.allowedInviteOthers)

  useEffect(() => {
    const nextMembers = parseLobbyMembers(lobbyContent, iconUrls)
    setMembers(nextMembers)
    setIsOwner(Boolean(nextMembers.find((member) => member.isLocalMember)?.isLeader))
    setRolePreferences(getLocalRolePreferences(nextMembers))
  }, [iconUrls, lobbyContent, setIsOwner, setMembers, setRolePreferences])

  useEffect(() => {
    setQueueStatus(parseQueueStatus(queueContent, queueHttpStatus))
  }, [queueContent, queueHttpStatus, setQueueStatus])

  useEffect(() => {
    setInvites(parseInvites(invitesContent))
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

  const sendAction = useCallback(
    async (label: string, action: () => Promise<unknown>) => {
      if (!transport || !isConnected) {
        setActionError('The League client is not connected yet.')
        return
      }

      setActionError(null)
      setIsActionPending(true)
      try {
        await action()
        lobbyRequest.refetch()
        queueRequest.refetch()
        invitesRequest.refetch()
      } catch (error) {
        const message = error instanceof Error ? error.message : `Failed to ${label}.`
        setActionError(message)
      } finally {
        setIsActionPending(false)
      }
    },
    [invitesRequest, isConnected, lobbyRequest, queueRequest, transport],
  )

  const joinQueue = useCallback(
    () => sendAction('join queue', () => transport?.request(LcuPaths.lobby.matchmakingSearch, LcuHttpMethod.POST) ?? Promise.resolve()),
    [sendAction, transport],
  )

  const leaveQueue = useCallback(
    () => sendAction('leave queue', () => transport?.request(LcuPaths.matchmaking.search, LcuHttpMethod.DELETE) ?? Promise.resolve()),
    [sendAction, transport],
  )

  const invitePlayer = useCallback(
    async (summonerName: string) => {
      const normalizedName = summonerName.trim()
      if (!normalizedName) {
        setActionError('Enter a summoner name to invite.')
        return
      }

      if (!canInvite) {
        setActionError('You do not have permission to invite players.')
        return
      }

      await sendAction('invite player', async () => {
        const lookup = await transport?.request(LcuPaths.summoner.summonersByName(normalizedName))
        const summonerId = readSummonerId(lookup?.content)
        if (lookup?.status !== 200 || summonerId === null) {
          throw new Error(`Could not find ${normalizedName}.`)
        }

        await transport?.request(LcuPaths.lobby.invitations, LcuHttpMethod.POST, [{ toSummonerId: summonerId }])
      })
    },
    [canInvite, sendAction, transport],
  )

  const promotePlayer = useCallback(
    (member: LobbyMember) => {
      if (!isOwner) {
        setActionError('Only the lobby owner can promote players.')
        return Promise.resolve()
      }

      return sendAction('promote player', () => transport?.request(LcuPaths.lobby.memberPromote(member.summonerId), LcuHttpMethod.POST) ?? Promise.resolve())
    },
    [isOwner, sendAction, transport],
  )

  const kickPlayer = useCallback(
    (member: LobbyMember) => {
      if (!isOwner) {
        setActionError('Only the lobby owner can kick players.')
        return Promise.resolve()
      }

      return sendAction('kick player', () => transport?.request(LcuPaths.lobby.memberKick(member.summonerId), LcuHttpMethod.POST) ?? Promise.resolve())
    },
    [isOwner, sendAction, transport],
  )

  const changeRole = useCallback(
    async (slot: keyof LobbyRolePreferences, role: LobbyRole) => {
      updateRole(slot, role)
      const nextPreferences = { ...rolePreferences, [slot]: role }
      await sendAction('change role', () =>
        transport?.request(LcuPaths.lobby.localMemberPositionPreferences, LcuHttpMethod.PUT, {
          firstPreference: nextPreferences.first,
          secondPreference: nextPreferences.second,
        }) ?? Promise.resolve(),
      )
    },
    [rolePreferences, sendAction, transport, updateRole],
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
    isLoading: lobbyRequest.isLoading || queueRequest.isLoading || invitesRequest.isLoading,
    isOwner,
    members,
    queueStatus,
    rolePreferences,
  }
}
