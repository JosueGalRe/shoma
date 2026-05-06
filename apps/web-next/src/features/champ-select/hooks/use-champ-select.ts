import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
  type ChampSelectPhase,
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
  bannedChampions: number[]
  championSkins: ChampionSkin[]
  currentAction: ChampSelectAction | null
  dataError: string | null
  isMyTurn: boolean
  isAram: boolean
  isArena: boolean
  isLoading: boolean
  lockInChampion: () => Promise<boolean>
  mode: GameMode
  phase: ChampSelectPhase
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

function derivePhase(currentAction: ChampSelectAction | null, actions: ChampSelectAction[][]): ChampSelectPhase {
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
  const queryClient = useQueryClient()

  const braveryEnabled = useChampSelectStore((state) => state.braveryEnabled)
  const changeRune = useChampSelectStore((state) => state.changeRune)
  const changeSkin = useChampSelectStore((state) => state.changeSkin)
  const changeSpell = useChampSelectStore((state) => state.changeSpell)
  const crowdFavorites = useChampSelectStore((state) => state.crowdFavorites)
  const decrementTimer = useChampSelectStore((state) => state.decrementTimer)
  const previewChampion = useChampSelectStore((state) => state.previewChampion)
  const reset = useChampSelectStore((state) => state.reset)
  const selectedChampion = useChampSelectStore((state) => state.selectedChampion)
  const selection = useChampSelectStore((state) => state.selection)
  const setChampions = useChampSelectStore((state) => state.setChampions)
  const setError = useChampSelectStore((state) => state.setError)
  const setSession = useChampSelectStore((state) => state.setSession)
  const storeActionsBan = useChampSelectStore((state) => state.ban)
  const storeError = useChampSelectStore((state) => state.error)
  const storeLockIn = useChampSelectStore((state) => state.lockIn)
  const storeSelectChampion = useChampSelectStore((state) => state.selectChampion)
  const toggleBravery = useChampSelectStore((state) => state.toggleBravery)

  const aramCardBench = useAramStore((state) => state.cardBench)
  const aramCards = useAramStore((state) => state.cards)
  const aramCompleteBenchSwap = useAramStore((state) => state.completeBenchSwap)
  const aramDrawCards = useAramStore((state) => state.drawCards)
  const aramError = useAramStore((state) => state.error)
  const aramHasBlessedCard = useAramStore((state) => state.hasBlessedCard)
  const aramReset = useAramStore((state) => state.reset)
  const aramSelectCard = useAramStore((state) => state.selectCard)
  const aramSelectedCardIndex = useAramStore((state) => state.selectedCardIndex)
  const aramSetAramState = useAramStore((state) => state.setAramState)
  const aramSetError = useAramStore((state) => state.setError)
  const aramSetLoading = useAramStore((state) => state.setLoading)
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
    const sessionSelectedChampion = currentAction?.championId || localMember?.championPickIntent || localMember?.championId || selectedChampion

    return {
      actions,
      bannedChampions: readBannedChampions(actions),
      currentAction,
      enemyTeam: session?.theirTeam ?? [],
      isMyTurn: Boolean(currentAction),
      localPlayerCellId,
      phase: derivePhase(currentAction, actions),
      selectedChampion: sessionSelectedChampion || null,
      session,
      team,
      timer: normalizeTimer(session),
    }
  }, [sessionQuery.data, selectedChampion])

  const rerollState = useMemo(() => {
    const rerollCount = readRerollCount(rerollQuery.data)

    return {
      canReroll: rerollCount > 0,
      hasLoadedRerolls: Boolean(rerollQuery.data || rerollQuery.error),
      rerollCount,
    }
  }, [rerollQuery.data, rerollQuery.error])

  const benchChampionIds = useMemo(() => {
    return [...new Set([...(sessionState.session?.benchChampionIds ?? []), ...aramCardBench])]
  }, [aramCardBench, sessionState.session?.benchChampionIds])

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
        void queryClient.invalidateQueries({ queryKey: champSelectSessionDescriptor.queryKey })
        return true
      } catch (error) {
        setError(normalizeError(error, 'Champ select action failed.'))
        return false
      }
    },
    [queryClient, sessionState.currentAction, setError, transport],
  )

  const selectChampionForTurn = useCallback(
    async (championId: number): Promise<boolean> => {
      if (!sessionState.currentAction || !sessionState.isMyTurn) {
        setError('champSelect.errors.notYourTurn')
        return false
      }

      setError(null)
      previewChampion(championId)
      return requestAction({ championId, completed: false, type: sessionState.currentAction.type })
    },
    [previewChampion, requestAction, sessionState.currentAction, sessionState.isMyTurn, setError],
  )

  const lockInChampion = useCallback(async (): Promise<boolean> => {
    if (!sessionState.currentAction || !sessionState.isMyTurn) {
      setError('champSelect.errors.noActivePickOrBanTurn')
      return false
    }

    setError(null)
    const championId = sessionState.selectedChampion ?? selectedChampion ?? sessionState.currentAction.championId
    if (!championId && sessionState.currentAction.type === 'pick') {
      setError('champSelect.errors.selectChampionBeforeLockingIn')
      return false
    }

    return requestAction({ championId: championId ?? 0, completed: true, type: sessionState.currentAction.type })
  }, [requestAction, selectedChampion, sessionState.currentAction, sessionState.isMyTurn, sessionState.selectedChampion, setError])

  const banChampion = useCallback(
    async (championId: number): Promise<boolean> => {
      if (!sessionState.currentAction || !sessionState.isMyTurn || sessionState.currentAction.type !== 'ban') {
        setError('champSelect.errors.notYourTurn')
        return false
      }

      setError(null)
      previewChampion(championId)
      return requestAction({ championId, completed: true, type: 'ban' })
    },
    [previewChampion, requestAction, sessionState.currentAction, sessionState.isMyTurn, setError],
  )

  const mode = resolveGameMode({
    benchEnabled: Boolean(sessionState.session?.benchEnabled || benchChampionIds.length > 0),
    gameMode: sessionState.session?.gameMode,
    mapId: sessionState.session?.mapId,
    queueId: sessionState.session?.queueId,
  })

  const rerollMutation = useMutation<unknown, Error, void>({
    mutationFn: async () => {
      if (!transport) {
        throw new Error('No transport')
      }

      const result = await transport.request(LcuPaths.champSelect.mySelectionReroll, LcuHttpMethod.POST)
      if (!isSuccessfulStatus(result.status)) {
        throw new Error(`Reroll failed (${result.status}).`)
      }

      return result
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: champSelectSessionDescriptor.queryKey }),
        queryClient.invalidateQueries({ queryKey: rerollPointsDescriptor.queryKey }),
      ])
    },
  })

  const benchSwapMutation = useMutation<unknown, Error, number>({
    mutationFn: async (championId) => {
      if (!transport) {
        throw new Error('No transport')
      }

      const result = await transport.request(LcuPaths.champSelect.benchSwap(championId), LcuHttpMethod.POST)
      if (!isSuccessfulStatus(result.status)) {
        throw new Error(`Bench swap failed (${result.status}).`)
      }

      return result
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: champSelectSessionDescriptor.queryKey }),
        queryClient.invalidateQueries({ queryKey: rerollPointsDescriptor.queryKey }),
      ])
    },
  })

  const reroll = useCallback(async (): Promise<boolean> => {
    if (!transport || !rerollState.canReroll) {
      return false
    }

    try {
      aramSetError(null)
      await rerollMutation.mutateAsync()
      return true
    } catch (error) {
      aramSetError(normalizeError(error, 'Reroll failed.'))
      return false
    }
  }, [aramSetError, rerollMutation, rerollState.canReroll, transport])

  const swapBench = useCallback(
    async (championId: number): Promise<boolean> => {
      if (!transport || !benchChampionIds.includes(championId)) {
        aramSetError('champSelect.errors.championNotOnBench')
        return false
      }

      try {
        aramSetError(null)
        await benchSwapMutation.mutateAsync(championId)
        aramCompleteBenchSwap(championId)
        return true
      } catch (error) {
        aramSetError(normalizeError(error, 'Bench swap failed.'))
        return false
      }
    },
    [aramCompleteBenchSwap, aramSetError, benchChampionIds, benchSwapMutation, transport],
  )

  const dataError = championsQuery.error || skinsQuery.error || runesQuery.error || spellsQuery.error || rerollQuery.error ? 'errors.generic' : null
  const error = storeError ?? (sessionQuery.error ? 'errors.generic' : null)

  return {
    actions: sessionState.actions,
    ban: storeActionsBan,
    bannedChampions: sessionState.bannedChampions,
    braveryEnabled,
    changeRune,
    changeSkin,
    changeSpell,
    champions: championsQuery.data ?? [],
    banChampion,
    championSkins: skinsQuery.data ?? [],
    currentAction: sessionState.currentAction,
    crowdFavorites,
    dataError,
    decrementTimer,
    enemyTeam: sessionState.enemyTeam,
    error,
    isAram: mode === 'aram',
    isArena: mode === 'arena',
    isLoading: sessionQuery.isLoading || championsQuery.isLoading,
    isMyTurn: sessionState.isMyTurn,
    lockInChampion,
    lockIn: storeLockIn,
    localPlayerCellId: sessionState.localPlayerCellId,
    mode,
    previewChampion,
    reset,
    runeTrees: runesQuery.data ?? [],
    selectedChampion: sessionState.selectedChampion,
    selectChampion: storeSelectChampion,
    session: sessionState.session,
    selectChampionForTurn,
    phase: sessionState.phase,
    selection: { ...selection, championId: sessionState.selectedChampion },
    setChampions,
    setError,
    setSession,
    team: sessionState.team,
    timer: liveTimer,
    toggleBravery,
    aram: {
      bench: benchChampionIds,
      canReroll: rerollState.canReroll,
      cardBench: aramCardBench,
      cards: aramCards,
      completeBenchSwap: aramCompleteBenchSwap,
      drawCards: aramDrawCards,
      error: aramError,
      hasBlessedCard: aramHasBlessedCard,
      hasLoadedRerolls: rerollState.hasLoadedRerolls,
      isLoading: rerollMutation.isPending || benchSwapMutation.isPending,
      rerollCount: rerollState.rerollCount,
      reset: aramReset,
      reroll,
      selectCard: aramSelectCard,
      selectedCardIndex: aramSelectedCardIndex,
      setAramState: aramSetAramState,
      setError: aramSetError,
      setLoading: aramSetLoading,
      swapBench,
    },
    summonerSpells: spellsQuery.data ?? [],
  }
}
