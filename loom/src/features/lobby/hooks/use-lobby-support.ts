import { useEffect, useRef, useState } from 'react'
import * as v from 'valibot'

import { finiteNumber, parseObjectOrNull } from '@/core/lcu/parsers/base'
import { SummonerId } from '@/core/types/branded'
import type { SummonerId as SummonerIdType } from '@/core/types/branded'

import type { LobbyMember } from '../lobby-store';
import type { LobbyRole } from '../lobby-store';
import type { LobbyRolePreferences } from '../lobby-store';
import type { CurrentSummonerPayload } from '../view-model/lobby-view-model';
import type { LobbyViewModel } from '../view-model/lobby-view-model';

export type LobbyActions = {
  changeRole: (slot: keyof LobbyRolePreferences, role: LobbyRole) => Promise<void>
  invitePlayer: (summonerName: string) => Promise<void>
  joinQueue: () => Promise<void>
  kickPlayer: (member: LobbyMember) => Promise<void>
  leaveQueue: () => Promise<void>
  promotePlayer: (member: LobbyMember) => Promise<void>
  setRolePreferences: (preferences: LobbyRolePreferences) => Promise<void>
  setPartyType: (partyType: string) => Promise<void>
}

export type UseLobbyResult = {
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
  const [isGracePeriodActive, setIsGracePeriodActive] = useState(false)
  const previousIsSearchingRef = useRef(isSearching)
  const graceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* eslint-disable react-doctor/no-cascading-set-state -- Grace period is a single derived state toggled by one external flag; setState calls are mutually exclusive branches */
  useEffect(() => {
    if (previousIsSearchingRef.current && !isSearching) {
      setIsGracePeriodActive(true)
      graceTimerRef.current = setTimeout(() => setIsGracePeriodActive(false), 3_000)
    } else if (isSearching) {
      setIsGracePeriodActive(false)
    }
    previousIsSearchingRef.current = isSearching
    return () => {
      if (graceTimerRef.current) clearTimeout(graceTimerRef.current)
    }
  }, [isSearching])

  return isGracePeriodActive
}
