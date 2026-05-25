import { useRef, useSyncExternalStore } from 'react'

import * as v from 'valibot'

import { finiteNumber, parseObjectOrNull } from '@/core/lcu/parsers/base'
import { SummonerId } from '@/core/types/branded'

import type { LobbyMember } from '../lobby-store'
import type { LobbyRole } from '../lobby-store'
import type { LobbyRolePreferences } from '../lobby-store'
import type { CurrentSummonerPayload } from '../view-model/lobby-view-model'
import type { LobbyViewModel } from '../view-model/lobby-view-model'
import type { SummonerId as SummonerIdType } from '@/core/types/branded'

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

export const CurrentSummonerPayloadSchema = v.object({
  accountId: v.fallback(v.optional(finiteNumber), undefined),
  displayName: v.fallback(v.optional(v.string()), undefined),
  gameName: v.fallback(v.optional(v.string()), undefined),
  name: v.fallback(v.optional(v.string()), undefined),
  profileIconId: v.fallback(v.optional(finiteNumber), undefined),
  summonerId: v.fallback(v.optional(finiteNumber), undefined),
  tagLine: v.fallback(v.optional(v.string()), undefined),
})

export class LobbyActionError extends Error {
  constructor(readonly errorKey: string) {
    super(errorKey)
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
