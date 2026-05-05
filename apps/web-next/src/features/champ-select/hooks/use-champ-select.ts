import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LcuHttpMethod, LcuPaths } from '@mimic/protocol-contract'

import {
  useChampionSkins,
  useChampions,
  useRunes,
  type ChampionSkin,
  type RuneTree,
} from '@/core/http/ddragon-client'
import { champSelectSessionDescriptor, createLcuQueryOptions, rerollPointsDescriptor, summonerSpellsDescriptor } from '@/core/lcu/lcu-queries'
import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import { useLCUTransport, useRiftClient } from '@/core/rift'
import { useRiftStore } from '@/core/state/rift-store'
import { useAramStore, type AramStore } from '@/features/champ-select/aram-store'
import {
  type ChampSelectAction,
  type ChampSelectSession,
  useChampSelectStore,
  type ChampSelectActionPatch,
  type ChampSelectStore,
} from '@/features/champ-select/champ-select-store'
import { resolveGameMode, type GameMode } from '@/features/modes/mode-engine'
import { notify } from '@/features/notifications/notification-manager'
import { useCountdown } from '@/hooks/useCountdown'

export type SummonerSpell = {
  description?: string
  gameModes?: string[]
  iconPath?: string
  id: number
  name: string
}

export type RerollPoints = {
  currentPoints?: number
  maxRolls?: number
  numberOfRolls?: number
  pointsCostToRoll?: number
  pointsToReroll?: number
}

export type UseChampSelectAram = Omit<AramStore, 'reroll' | 'swapBench'> & {
  reroll: () => Promise<boolean>
  swapBench: (championId: number) => Promise<boolean>
}

export type UseChampSelectResult = ChampSelectStore & {
  aram: UseChampSelectAram
  banChampion: (championId: number) => Promise<boolean>
  championSkins: ChampionSkin[]
  dataError: string | null
  isAram: boolean
  isArena: boolean
  isLoading: boolean
  lockInChampion: () => Promise<boolean>
  mode: GameMode
  runeTrees: RuneTree[]
  selectChampionForTurn: (championId: number) => Promise<boolean>
  summonerSpells: SummonerSpell[]
}

function isSuccessfulStatus(status: number): boolean {
  return status >= 200 && status < 300
}

function normalizeError(error: unknown, fallback: string): Error {
  return error instanceof Error ? error : new Error(fallback)
}

function readRerollCount(points: RerollPoints | null | undefined): number {
  return Math.max(0, points?.numberOfRolls ?? 0)
}

function readCurrentTurn(actions: ChampSelectAction[][]): ChampSelectAction[] | null {
  return actions.find((turn) => turn.some((action) => !action.completed && (action.type === 'pick' || action.type === 'ban'))) ?? null
}

function readCurrentAction(actions: ChampSelectAction[][], localPlayerCellId: number | null): ChampSelectAction | null {
  const currentTurn = readCurrentTurn(actions)
  if (!currentTurn || localPlayerCellId === null) {
    return null
  }

  return currentTurn.find((action) => action.actorCellId === localPlayerCellId && !action.completed) ?? null
}

function derivePhase(currentAction: ChampSelectAction | null, actions: ChampSelectAction[][]): 'pick' | 'ban' | 'waiting' {
  if (currentAction?.type === 'pick' || currentAction?.type === 'ban') {
    return currentAction.type
  }

  const turnAction = readCurrentTurn(actions)?.find((action) => !action.completed && (action.type === 'pick' || action.type === 'ban'))
  return turnAction?.type === 'pick' || turnAction?.type === 'ban' ? turnAction.type : 'waiting'
}

function readBannedChampions(actions: ChampSelectAction[][]): number[] {
  return actions.flat().filter((action) => action.type === 'ban' && action.completed && action.championId > 0).map((action) => action.championId)
}

function normalizeTimer(session: ChampSelectSession | null | undefined): number {
  return Math.max(0, Math.ceil((session?.timer?.adjustedTimeLeftInPhase ?? 0) / 1000))
}

export function useChampSelect(): UseChampSelectResult {
  const code = useRiftStore((state) => state.code)
  const status = useRiftStore((state) => state.status)
  const shouldConnect = status === 'connecting' || status === 'connected'
  const clientOptions = useMemo(() => ({ code, enabled: shouldConnect && code.length > 0 }), [code, shouldConnect])
  const { client } = useRiftClient(clientOptions)
  const transport = useLCUTransport(client)

  const store = useChampSelectStore()
  const aram = useAramStore()
  const sessionQuery = useQuery(createLcuQueryOptions(champSelectSessionDescriptor, transport))
  useLcuObserverSync(champSelectSessionDescriptor, transport)
  const spellsQuery = useQuery(createLcuQueryOptions(summonerSpellsDescriptor, transport))
  const rerollQuery = useQuery(createLcuQueryOptions(rerollPointsDescriptor, transport))
  const championsQuery = useChampions()
  const runesQuery = useRunes()
  const hasNotifiedCurrentTurn = useRef<string | null>(null)
  const hasNotifiedLowTimer = useRef(false)

  const sessionState = useMemo(() => {
    const session = sessionQuery.data ?? null
    const actions = session?.actions ?? []
    const localPlayerCellId = session?.localPlayerCellId ?? null
    const currentAction = readCurrentAction(actions, localPlayerCellId)
    const team = session?.myTeam ?? []
    const localMember = team.find((member) => member.cellId === localPlayerCellId)
    const selectedChampion = currentAction?.championId || localMember?.championPickIntent || localMember?.championId || store.selectedChampion

    return {
      actions,
      bannedChampions: readBannedChampions(actions),
      currentAction,
      enemyTeam: session?.theirTeam ?? [],
      isMyTurn: Boolean(currentAction),
      localPlayerCellId,
      phase: derivePhase(currentAction, actions),
      selectedChampion: selectedChampion || null,
      session,
      team,
      timer: normalizeTimer(session),
    }
  }, [sessionQuery.data, store.selectedChampion])

  const rerollState = useMemo(() => {
    const rerollCount = readRerollCount(rerollQuery.data)

    return {
      canReroll: rerollCount > 0,
      hasLoadedRerolls: Boolean(rerollQuery.data || rerollQuery.error),
      rerollCount,
    }
  }, [rerollQuery.data, rerollQuery.error])

  const benchChampionIds = useMemo(() => {
    return [...new Set([...(sessionState.session?.benchChampionIds ?? []), ...aram.cardBench])]
  }, [aram.cardBench, sessionState.session?.benchChampionIds])

  const countdown = useCountdown(sessionState.session ? sessionState.timer : 0)
  const liveTimer = countdown.remaining

  const currentTurnKey = sessionState.currentAction ? `${sessionState.currentAction.id}:${sessionState.currentAction.type}` : null
  // External system sync: Browser notification API
  useEffect(() => {
    if (!sessionState.isMyTurn || !currentTurnKey) {
      hasNotifiedCurrentTurn.current = null
      return
    }

    if (hasNotifiedCurrentTurn.current !== currentTurnKey) {
      notify(sessionState.phase === 'ban' ? 'your-turn-ban' : 'your-turn-pick')
      hasNotifiedCurrentTurn.current = currentTurnKey
    }
  }, [currentTurnKey, sessionState.isMyTurn, sessionState.phase])

  // External system sync: Browser notification API
  useEffect(() => {
    if (!sessionState.isMyTurn || liveTimer <= 0) {
      hasNotifiedLowTimer.current = false
      return
    }

    if (liveTimer < 10 && !hasNotifiedLowTimer.current) {
      notify('low-timer', { seconds: String(liveTimer) })
      hasNotifiedLowTimer.current = true
      return
    }

    if (liveTimer >= 10) {
      hasNotifiedLowTimer.current = false
    }
  }, [liveTimer, sessionState.isMyTurn])

  const skinsQuery = useChampionSkins(sessionState.selectedChampion ?? undefined)

  const requestAction = useCallback(
    async (patch: ChampSelectActionPatch | null): Promise<boolean> => {
      if (!transport || !sessionState.currentAction || !patch) {
        return false
      }

      try {
        const result = await transport.request(LcuPaths.champSelect.action(sessionState.currentAction.id), LcuHttpMethod.PATCH, patch)
        if (!isSuccessfulStatus(result.status)) {
          throw new Error(`Champ select action failed (${result.status}).`)
        }
        void sessionQuery.refetch()
        return true
      } catch (error) {
        store.setError(normalizeError(error, 'Champ select action failed.'))
        return false
      }
    },
    [sessionQuery, sessionState.currentAction, store, transport],
  )

  const selectChampionForTurn = useCallback(
    async (championId: number): Promise<boolean> => {
      if (!sessionState.currentAction || !sessionState.isMyTurn) {
        store.setError('champSelect.errors.notYourTurn')
        return false
      }

      store.setError(null)
      store.previewChampion(championId)
      return requestAction({ championId, completed: false, type: sessionState.currentAction.type })
    },
    [requestAction, sessionState.currentAction, sessionState.isMyTurn, store],
  )

  const lockInChampion = useCallback(async (): Promise<boolean> => {
    if (!sessionState.currentAction || !sessionState.isMyTurn) {
      store.setError('champSelect.errors.noActivePickOrBanTurn')
      return false
    }

    store.setError(null)
    const championId = sessionState.selectedChampion ?? store.selectedChampion ?? sessionState.currentAction.championId
    if (!championId && sessionState.currentAction.type === 'pick') {
      store.setError('champSelect.errors.selectChampionBeforeLockingIn')
      return false
    }

    return requestAction({ championId: championId ?? 0, completed: true, type: sessionState.currentAction.type })
  }, [requestAction, sessionState.currentAction, sessionState.isMyTurn, sessionState.selectedChampion, store])

  const banChampion = useCallback(
    async (championId: number): Promise<boolean> => {
      if (!sessionState.currentAction || !sessionState.isMyTurn || sessionState.currentAction.type !== 'ban') {
        store.setError('champSelect.errors.notYourTurn')
        return false
      }

      store.setError(null)
      store.previewChampion(championId)
      return requestAction({ championId, completed: true, type: 'ban' })
    },
    [requestAction, sessionState.currentAction, sessionState.isMyTurn, store],
  )

  const mode = resolveGameMode({
    benchEnabled: Boolean(sessionState.session?.benchEnabled || benchChampionIds.length > 0),
    gameMode: sessionState.session?.gameMode,
    mapId: sessionState.session?.mapId,
    queueId: sessionState.session?.queueId,
  })

  const reroll = useCallback(async (): Promise<boolean> => {
    if (!transport || !rerollState.canReroll) {
      return false
    }

    aram.setLoading(true)
    try {
      aram.setError(null)
      const result = await transport.request(LcuPaths.champSelect.mySelectionReroll, LcuHttpMethod.POST)
      if (!isSuccessfulStatus(result.status)) {
        throw new Error(`Reroll failed (${result.status}).`)
      }
      void sessionQuery.refetch()
      void rerollQuery.refetch()
      return true
    } catch (error) {
      aram.setError(normalizeError(error, 'Reroll failed.'))
      return false
    } finally {
      aram.setLoading(false)
    }
  }, [aram, rerollQuery, rerollState.canReroll, sessionQuery, transport])

  const swapBench = useCallback(
    async (championId: number): Promise<boolean> => {
      if (!transport || !benchChampionIds.includes(championId)) {
        aram.setError('champSelect.errors.championNotOnBench')
        return false
      }

      aram.setLoading(true)
      try {
        aram.setError(null)
        const result = await transport.request(LcuPaths.champSelect.benchSwap(championId), LcuHttpMethod.POST)
        if (!isSuccessfulStatus(result.status)) {
          throw new Error(`Bench swap failed (${result.status}).`)
        }
        void sessionQuery.refetch()
        aram.completeBenchSwap(championId)
        return true
      } catch (error) {
        aram.setError(normalizeError(error, 'Bench swap failed.'))
        return false
      } finally {
        aram.setLoading(false)
      }
    },
    [aram, benchChampionIds, sessionQuery, transport],
  )

  const dataError = championsQuery.error || skinsQuery.error || runesQuery.error || spellsQuery.error || rerollQuery.error ? 'errors.generic' : null
  const error = store.error ?? (sessionQuery.error ? 'errors.generic' : null)

  return {
    ...store,
    actions: sessionState.actions,
    bannedChampions: sessionState.bannedChampions,
    champions: championsQuery.data ?? [],
    banChampion,
    championSkins: skinsQuery.data ?? [],
    currentAction: sessionState.currentAction,
    dataError,
    enemyTeam: sessionState.enemyTeam,
    error,
    isAram: mode === 'aram',
    isArena: mode === 'arena',
    isLoading: sessionQuery.isLoading || championsQuery.isLoading,
    isMyTurn: sessionState.isMyTurn,
    lockInChampion,
    localPlayerCellId: sessionState.localPlayerCellId,
    mode,
    runeTrees: runesQuery.data ?? [],
    selectedChampion: sessionState.selectedChampion,
    session: sessionState.session,
    selectChampionForTurn,
    phase: sessionState.phase,
    selection: { ...store.selection, championId: sessionState.selectedChampion },
    team: sessionState.team,
    timer: liveTimer,
    aram: {
      ...aram,
      bench: benchChampionIds,
      canReroll: rerollState.canReroll,
      hasLoadedRerolls: rerollState.hasLoadedRerolls,
      rerollCount: rerollState.rerollCount,
      reroll,
      swapBench,
    },
    summonerSpells: spellsQuery.data ?? [],
  }
}
