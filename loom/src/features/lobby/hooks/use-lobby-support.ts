import { useRef, useSyncExternalStore } from 'react'

import { fallback, object, optional, string } from 'valibot'

import { finiteNumber, parseObjectOrNull } from '@/core/lcu/parsers/base'
import { SummonerId, type SummonerId as SummonerIdType } from '@/core/types/branded'

import type { LobbyMember, LobbyRole, LobbyRolePreferences } from '../lobby-store'
import type { CurrentSummonerPayload, LobbyViewModel } from '../view-model/lobby-view-model'

export interface LobbyActions {
  changeRole: (slot: keyof LobbyRolePreferences, role: LobbyRole) => Promise<void>
  invitePlayer: (summonerName: string) => Promise<void>
  joinQueue: () => Promise<void>
  kickPlayer: (member: LobbyMember) => Promise<void>
  leaveQueue: () => Promise<void>
  promotePlayer: (member: LobbyMember) => Promise<void>
  setRolePreferences: (preferences: LobbyRolePreferences) => Promise<void>
  setPartyType: (partyType: string) => Promise<void>
}

export interface UseLobbyResult {
  viewModel: LobbyViewModel
  actions: LobbyActions
  isLoading: boolean
  isLobbyLoading: boolean
  isLobbyFetching: boolean
  isConnected: boolean
  isActionPending: boolean
  isSettingPartyType: boolean
  actionError: string | null
}

const GRACE_PERIOD_DURATION_MS = 3000
const GRACE_PERIOD_TICK_MS = 250

let currentTimestamp = Date.now()
const timestampSubscribers = new Set<() => void>()
let timestampInterval: ReturnType<typeof setInterval> | null = null

function subscribeToTimestampUpdates(onStoreChange: () => void): () => void {
  timestampSubscribers.add(onStoreChange)

  if (timestampInterval === null) {
    timestampInterval = setInterval(() => {
      currentTimestamp = Date.now()

      timestampSubscribers.forEach((listener) => {
        listener()
      })
    }, GRACE_PERIOD_TICK_MS)
  }

  return () => {
    timestampSubscribers.delete(onStoreChange)

    if (timestampSubscribers.size === 0 && timestampInterval !== null) {
      clearInterval(timestampInterval)
      timestampInterval = null
    }
  }
}

function getCurrentTimestamp(): number {
  return currentTimestamp
}

export const CurrentSummonerPayloadSchema = object({
  accountId: fallback(optional(finiteNumber), undefined),
  displayName: fallback(optional(string()), undefined),
  gameName: fallback(optional(string()), undefined),
  name: fallback(optional(string()), undefined),
  profileIconId: fallback(optional(finiteNumber), undefined),
  summonerId: fallback(optional(finiteNumber), undefined),
  tagLine: fallback(optional(string()), undefined),
})

export class LobbyActionError extends Error {
  readonly errorKey: string

  constructor(errorKey: string) {
    super(errorKey)
    this.name = 'LobbyActionError'
    this.errorKey = errorKey
  }
}

export function readSummonerId(content: unknown): SummonerIdType | null {
  const summoner = parseObjectOrNull(CurrentSummonerPayloadSchema, content)
  const summonerId = summoner?.summonerId ?? summoner?.accountId

  return summonerId === undefined ? null : SummonerId(summonerId)
}

export function parseCurrentSummonerPayload(content: unknown): CurrentSummonerPayload | null {
  const summoner = parseObjectOrNull(CurrentSummonerPayloadSchema, content)

  return summoner
    ? {
        displayName: summoner.displayName,
        gameName: summoner.gameName,
        name: summoner.name,
        profileIconId: summoner.profileIconId,
        summonerId: readSummonerId(summoner) ?? undefined,
        tagLine: summoner.tagLine,
      }
    : null
}

export function useLobbyGracePeriod(isSearching: boolean): boolean {
  const now = useSyncExternalStore(subscribeToTimestampUpdates, getCurrentTimestamp, getCurrentTimestamp)
  const previousIsSearchingRef = useRef(isSearching)
  const gracePeriodEndsAtRef = useRef<number | null>(null)

  if (isSearching) {
    gracePeriodEndsAtRef.current = null
  } else if (previousIsSearchingRef.current) {
    gracePeriodEndsAtRef.current = now + GRACE_PERIOD_DURATION_MS
  }

  previousIsSearchingRef.current = isSearching

  return gracePeriodEndsAtRef.current !== null && now < gracePeriodEndsAtRef.current
}
