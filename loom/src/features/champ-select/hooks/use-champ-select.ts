import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import { useChampionSkins, useChampions, useRunes } from '@/core/http/ddragon-client'
import type { ChampionSkin } from '@/core/http/ddragon-client'
import type { RuneTree } from '@/core/http/ddragon-client'
import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import {
  champSelectSessionDescriptor,
  createLcuQueryOptions,
  rerollPointsDescriptor,
  summonerSpellsDescriptor,
} from '@/core/lcu/lcu-queries'
import { useSharedLCUTransport } from '@/core/relay/relay-client-provider'
import { ChampionId } from '@/core/types/branded'
import type { CellId } from '@/core/types/branded'
import type { ChampionId as ChampionIdType } from '@/core/types/branded'
import type { SpellId } from '@/core/types/branded'
import { useAramStore } from '@/features/champ-select/champ-select-aram-store'
import type { AramStore } from '@/features/champ-select/champ-select-aram-store'
import { useChampSelectErrorStore } from '@/features/champ-select/champ-select-error-store'
import type { ChampSelectAction } from '@/features/champ-select/champ-select-actions'
import type { ChampSelectActionPatch } from '@/features/champ-select/champ-select-actions'
import type { ChampSelectMember } from '@/features/champ-select/champ-select-actions'
import type { ChampSelectPhase } from '@/features/champ-select/champ-select-actions'
import type { ChampSelectSession } from '@/features/champ-select/champ-select-actions'
import { derivePhase } from '@/features/champ-select/champ-select-actions'
import { readBannedChampions } from '@/features/champ-select/champ-select-actions'
import { readCurrentAction } from '@/features/champ-select/champ-select-actions'
import { useChampSelectUiStore } from '@/features/champ-select/champ-select-ui-store'
import type { ChampSelectUiStore } from '@/features/champ-select/champ-select-ui-store'
import { resolveGameMode } from '@/features/modes/mode-engine';
import type { GameMode } from '@/features/modes/mode-engine';
import { notify } from '@/features/notifications/notification-manager'
import { useCountdown } from '@/hooks/use-countdown'
import { LcuHttpMethod, LcuPaths } from '@shoma/protocol-contract'

export type SummonerSpell = {
  description?: string
  gameModes?: string[]
  iconPath?: string
  id: SpellId
  name: string
}

export type RerollPoints = {
  currentPoints?: number
  maxRolls?: number
  numberOfRolls?: number
  pointsCostToRoll?: number
  pointsToReroll?: number
}

type UseChampSelectAram = Omit<AramStore, 'reroll' | 'swapBench'> & {
  hasBlessedCard: boolean
  error: string | null
  reroll: () => Promise<boolean>
  swapBench: (championId: ChampionIdType) => Promise<boolean>
  setError: (error: unknown) => void
}

export type UseChampSelectResult = ChampSelectUiStore & {
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
  error: string | null
  setError: (error: unknown) => void
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

function normalizeTimer(session: ChampSelectSession | null | undefined): number {
  return Math.max(0, Math.ceil((session?.timer?.adjustedTimeLeftInPhase ?? 0) / 1000))
}

export function useChampSelect(): UseChampSelectResult {
  const transport = useSharedLCUTransport()
  const queryClient = useQueryClient()

  const braveryEnabled = useChampSelectUiStore((state) => state.braveryEnabled)
  const changeRune = useChampSelectUiStore((state) => state.changeRune)
  const changeSkin = useChampSelectUiStore((state) => state.changeSkin)
  const changeSpell = useChampSelectUiStore((state) => state.changeSpell)
  const champions = useChampSelectUiStore((state) => state.champions)
  const decrementTimer = useChampSelectUiStore((state) => state.decrementTimer)
  const previewChampion = useChampSelectUiStore((state) => state.previewChampion)
  const reset = useChampSelectUiStore((state) => state.reset)
  const selectedChampion = useChampSelectUiStore((state) => state.selectedChampion)
  const selection = useChampSelectUiStore((state) => state.selection)
  const setChampions = useChampSelectUiStore((state) => state.setChampions)
  const setRuntimeState = useChampSelectUiStore((state) => state.setRuntimeState)
  const setSession = useChampSelectUiStore((state) => state.setSession)
  const setSelectChampionForTurnHandler = useChampSelectUiStore((state) => state.setSelectChampionForTurnHandler)
  const session = useChampSelectUiStore((state) => state.session)
  const storeActionsBan = useChampSelectUiStore((state) => state.ban)
  const storeLockIn = useChampSelectUiStore((state) => state.lockIn)
  const storeSelectChampion = useChampSelectUiStore((state) => state.selectChampion)
  const toggleBravery = useChampSelectUiStore((state) => state.toggleBravery)

  const setError = useChampSelectErrorStore((state) => state.setError)
  const storeError = useChampSelectErrorStore((state) => state.error)
  const aramError = useChampSelectErrorStore((state) => state.aramError)
  const aramSetError = useChampSelectErrorStore((state) => state.setAramError)

  const aramCardBench = useAramStore((state) => state.cardBench)
  const aramCards = useAramStore((state) => state.cards)
  const aramCompleteBenchSwap = useAramStore((state) => state.completeBenchSwap)
  const aramDrawCards = useAramStore((state) => state.drawCards)
  const aramReset = useAramStore((state) => state.reset)
  const aramSelectCard = useAramStore((state) => state.selectCard)
  const aramSelectedCardIndex = useAramStore((state) => state.selectedCardIndex)
  const aramSetAramState = useAramStore((state) => state.setAramState)
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
