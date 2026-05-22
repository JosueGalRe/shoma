import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import { useChampionSkins, useChampions, useRunes, type ChampionSkin, type RuneTree } from '@/core/http/ddragon-client'
import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import {
  champSelectSessionDescriptor,
  createLcuQueryOptions,
  rerollPointsDescriptor,
  summonerSpellsDescriptor,
} from '@/core/lcu/lcu-queries'
import { useSharedLCUTransport } from '@/core/relay/relay-client-provider'
import { ChampionId, type CellId, type ChampionId as ChampionIdType, type SpellId } from '@/core/types/branded'
import { useAramStore, type AramStore } from '@/features/champ-select/aram-store'
import {
  type ChampSelectAction,
  type ChampSelectMember,
  type ChampSelectPhase,
  type ChampSelectSession,
  useChampSelectStore,
  type ChampSelectActionPatch,
  type ChampSelectStore,
} from '@/features/champ-select/champ-select-store'
import { resolveGameMode, type GameMode } from '@/features/modes/mode-engine'
import { notify } from '@/features/notifications/notification-manager'
import { useCountdown } from '@/hooks/useCountdown'
import { LcuHttpMethod, LcuPaths } from '@shoma/protocol-contract'

export type SummonerSpell = {
  description?: string
  gameModes?: string[]
  iconPath?: string
  id: SpellId
  name: string
}

// @knip
export type RerollPoints = {
  currentPoints?: number
  maxRolls?: number
  numberOfRolls?: number
  pointsCostToRoll?: number
  pointsToReroll?: number
}

type UseChampSelectAram = Omit<AramStore, 'reroll' | 'swapBench'> & {
  hasBlessedCard: boolean
  reroll: () => Promise<boolean>
  swapBench: (championId: ChampionIdType) => Promise<boolean>
}

export type UseChampSelectResult = ChampSelectStore & {
  aram: UseChampSelectAram
  actions: ChampSelectAction[][]
  banChampion: (championId: ChampionIdType) => Promise<boolean>
  bannedChampions: ChampionIdType[]
  championSkins: ChampionSkin[]
  currentAction: ChampSelectAction | null
  crowdFavorites: ChampionIdType[]
  dataError: string | null
  enemyTeam: ChampSelectMember[]
  isMyTurn: boolean
  isAram: boolean
  isArena: boolean
  isLoading: boolean
  lockInChampion: () => Promise<boolean>
  localPlayerCellId: CellId | null
  mode: GameMode
  phase: ChampSelectPhase
  runeTrees: RuneTree[]
  selectChampionForTurn: (championId: ChampionIdType) => Promise<boolean>
  summonerSpells: SummonerSpell[]
  team: ChampSelectMember[]
  timer: number
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
  return (
    actions.find((turn) => turn.some((action) => !action.completed && (action.type === 'pick' || action.type === 'ban'))) ??
    null
  )
}

function readCurrentAction(actions: ChampSelectAction[][], localPlayerCellId: CellId | null): ChampSelectAction | null {
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

  const turnAction = readCurrentTurn(actions)?.find(
    (action) => !action.completed && (action.type === 'pick' || action.type === 'ban'),
  )
  return turnAction?.type === 'pick' || turnAction?.type === 'ban' ? turnAction.type : 'waiting'
}

function readBannedChampions(actions: ChampSelectAction[][]): ChampionIdType[] {
  return actions
    .flat()
    .filter((action) => action.type === 'ban' && action.completed && action.championId > 0)
    .map((action) => action.championId)
}

function normalizeTimer(session: ChampSelectSession | null | undefined): number {
  return Math.max(0, Math.ceil((session?.timer?.adjustedTimeLeftInPhase ?? 0) / 1000))
}

export function useChampSelect(): UseChampSelectResult {
  const transport = useSharedLCUTransport()
  const queryClient = useQueryClient()

  const braveryEnabled = useChampSelectStore((state) => state.braveryEnabled)
  const changeRune = useChampSelectStore((state) => state.changeRune)
  const changeSkin = useChampSelectStore((state) => state.changeSkin)
  const changeSpell = useChampSelectStore((state) => state.changeSpell)
  const champions = useChampSelectStore((state) => state.champions)
  const decrementTimer = useChampSelectStore((state) => state.decrementTimer)
  const previewChampion = useChampSelectStore((state) => state.previewChampion)
  const reset = useChampSelectStore((state) => state.reset)
  const selectedChampion = useChampSelectStore((state) => state.selectedChampion)
  const selection = useChampSelectStore((state) => state.selection)
  const setChampions = useChampSelectStore((state) => state.setChampions)
  const setError = useChampSelectStore((state) => state.setError)
  const setRuntimeState = useChampSelectStore((state) => state.setRuntimeState)
  const setSession = useChampSelectStore((state) => state.setSession)
  const setSelectChampionForTurnHandler = useChampSelectStore((state) => state.setSelectChampionForTurnHandler)
  const session = useChampSelectStore((state) => state.session)
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
  const crowdFavorites = useMemo(() => champions.slice(0, 6).map((champion) => champion.id), [champions])

  // External system sync: keep source query data in the champ-select store; derived fields are read from selectors below.
  useEffect(() => {
    setSession(sessionQuery.data)
  }, [sessionQuery.data, setSession])

  useEffect(() => {
    if (championsQuery.data) {
      setChampions(championsQuery.data)
    }
  }, [championsQuery.data, setChampions])

  const sessionState = useMemo(() => {
    const currentSession = session ?? null
    const actions = currentSession?.actions ?? []
    const localPlayerCellId = currentSession?.localPlayerCellId ?? null
    const currentAction = readCurrentAction(actions, localPlayerCellId)
    const team = currentSession?.myTeam ?? []
    const localMember = team.find((member) => member.cellId === localPlayerCellId)
    const sessionSelectedChampion =
      currentAction?.championId || localMember?.championPickIntent || localMember?.championId || selectedChampion

    return {
      actions,
      bannedChampions: readBannedChampions(actions),
      currentAction,
      enemyTeam: currentSession?.theirTeam ?? [],
      isMyTurn: Boolean(currentAction),
      localPlayerCellId,
      phase: derivePhase(currentAction, actions),
      selectedChampion: sessionSelectedChampion || null,
      session: currentSession,
      team,
      timer: normalizeTimer(currentSession),
    }
  }, [selectedChampion, session])

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
  const aramHasBlessedCard = useMemo(() => aramCards.some((card) => card.isBlessed), [aramCards])

  const countdown = useCountdown(sessionState.session ? sessionState.timer : 0)
  const liveTimer = countdown.remaining

  const currentTurnKey = sessionState.currentAction
    ? `${sessionState.currentAction.id}:${sessionState.currentAction.type}`
    : null
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
        const result = await transport.request(
          LcuPaths.champSelect.action(sessionState.currentAction.id),
          LcuHttpMethod.PATCH,
          patch,
        )
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
    async (championId: ChampionIdType): Promise<boolean> => {
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

    return requestAction({ championId: championId ?? ChampionId(0), completed: true, type: sessionState.currentAction.type })
  }, [
    requestAction,
    selectedChampion,
    sessionState.currentAction,
    sessionState.isMyTurn,
    sessionState.selectedChampion,
    setError,
  ])

  const banChampion = useCallback(
    async (championId: ChampionIdType): Promise<boolean> => {
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

  useEffect(() => {
    setRuntimeState({ isAram: mode === 'aram', isLoading: sessionQuery.isLoading || championsQuery.isLoading })
  }, [championsQuery.isLoading, mode, sessionQuery.isLoading, setRuntimeState])

  useEffect(() => {
    setSelectChampionForTurnHandler(selectChampionForTurn)

    return () => setSelectChampionForTurnHandler(null)
  }, [selectChampionForTurn, setSelectChampionForTurnHandler])

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

  const benchSwapMutation = useMutation<unknown, Error, ChampionIdType>({
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
    async (championId: ChampionIdType): Promise<boolean> => {
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

  const dataError =
    championsQuery.error || skinsQuery.error || runesQuery.error || spellsQuery.error || rerollQuery.error
      ? 'errors.generic'
      : null
  const error = storeError ?? (sessionQuery.error ? 'errors.generic' : null)

  return {
    actions: sessionState.actions,
    ban: storeActionsBan,
    bannedChampions: sessionState.bannedChampions,
    benchChampionIds,
    braveryEnabled,
    changeRune,
    changeSkin,
    changeSpell,
    champions,
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
    setRuntimeState,
    setSession,
    setSelectChampionForTurnHandler,
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
