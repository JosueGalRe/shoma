import { LcuPaths } from '@shoma/protocol-contract'
import { type InferOutput, string } from 'valibot'

import { parseOrNull, unknownArray } from '../parsers/base'
import { parseInvites } from '../parsers/invites'
import {
  emptyLobbyQueueStatus,
  parseLobbyMembers,
  parseLobbyMode,
  parseLobbyQueueId,
  parseLobbySentInvites,
  parsePartyType,
  parseQueueStatus,
} from '../parsers/lobby'
import { parseQueueSearchState, type QueueSearchState } from '../parsers/queue'
import { parseReadyCheck } from '../parsers/ready-check'

import { lcuQueryKey } from './descriptor'

import type { LcuQueryDescriptor } from './descriptor'

const emptyLobbyMembers: ReturnType<typeof parseLobbyMembers> = {
  localSummonerId: null,
  members: [],
}

const emptyLobbySession = {
  ...emptyLobbyMembers,
  mode: 'normal-draft' as const,
  partyType: null satisfies string | null,
  queueId: null satisfies number | null,
}

export const lobbyDescriptor = {
  notFoundValue: emptyLobbyMembers,
  parse: (content: unknown) => {
    return parseLobbyMembers(content, {}, null)
  },
  path: LcuPaths.lobby.lobby,
  queryKey: lcuQueryKey(LcuPaths.lobby.lobby),
} satisfies LcuQueryDescriptor<ReturnType<typeof parseLobbyMembers>>

export const lobbySessionDescriptor = {
  notFoundValue: emptyLobbySession,
  parse: (content: unknown) => {
    const parsed = parseLobbyMembers(content, {}, null)
    const mode = parseLobbyMode(content)
    const partyType = parsePartyType(content)
    const queueId = parseLobbyQueueId(content)

    return {
      localSummonerId: parsed.localSummonerId,
      members: parsed.members,
      mode,
      partyType,
      queueId,
    }
  },
  path: LcuPaths.lobby.lobby,
  queryKey: lcuQueryKey(LcuPaths.lobby.lobby),
} satisfies LcuQueryDescriptor<
  ReturnType<typeof parseLobbyMembers> & {
    mode: ReturnType<typeof parseLobbyMode>
    partyType: ReturnType<typeof parsePartyType>
    queueId: ReturnType<typeof parseLobbyQueueId>
  }
>

export const queueDescriptor = {
  notFoundValue: emptyLobbyQueueStatus,
  parse: (content: unknown) => {
    return parseQueueStatus(content, null)
  },
  path: LcuPaths.matchmaking.search,
  queryKey: lcuQueryKey(LcuPaths.matchmaking.search),
} satisfies LcuQueryDescriptor<ReturnType<typeof parseQueueStatus>>

export const invitesDescriptor = {
  parse: parseInvites,
  path: LcuPaths.lobby.receivedInvitations,
  queryKey: lcuQueryKey(LcuPaths.lobby.receivedInvitations),
} satisfies LcuQueryDescriptor<ReturnType<typeof parseInvites>>

export const sentInvitesDescriptor = {
  parse: parseLobbySentInvites,
  path: LcuPaths.lobby.invitations,
  queryKey: lcuQueryKey(LcuPaths.lobby.invitations),
} satisfies LcuQueryDescriptor<ReturnType<typeof parseLobbySentInvites>>

export const readyCheckDescriptor = {
  parse: parseReadyCheck,
  path: LcuPaths.matchmaking.readyCheck,
  queryKey: lcuQueryKey(LcuPaths.matchmaking.readyCheck),
} satisfies LcuQueryDescriptor<ReturnType<typeof parseReadyCheck>>

export const queueSearchDescriptor = {
  notFoundValue: {},
  parse: parseQueueSearchState,
  path: LcuPaths.matchmaking.search,
  queryKey: [...lcuQueryKey(LcuPaths.matchmaking.search), 'search-state'] as const,
} satisfies LcuQueryDescriptor<QueueSearchState>

export const gameflowPhaseDescriptor = {
  parse: (content: unknown) => {
    return parseOrNull(string(), content)
  },
  path: LcuPaths.gameflow.phase,
  queryKey: lcuQueryKey(LcuPaths.gameflow.phase),
} satisfies LcuQueryDescriptor<string>

export const recentPlayersDescriptor = {
  parse: (content: unknown) => {
    return parseOrNull(unknownArray, content)
  },
  path: LcuPaths.matchHistory.recentPlayers,
  queryKey: lcuQueryKey(LcuPaths.matchHistory.recentPlayers),
} satisfies LcuQueryDescriptor<InferOutput<typeof unknownArray>>

export const suggestedPlayersDescriptor = {
  parse: (content: unknown) => {
    return parseOrNull(unknownArray, content)
  },
  path: LcuPaths.suggestedPlayers.suggestedPlayers,
  queryKey: lcuQueryKey(LcuPaths.suggestedPlayers.suggestedPlayers),
} satisfies LcuQueryDescriptor<InferOutput<typeof unknownArray>>
