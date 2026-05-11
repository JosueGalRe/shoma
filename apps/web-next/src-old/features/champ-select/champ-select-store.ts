import { LcuPaths } from '@mimic/protocol-contract'
import { create } from 'zustand'

import { createLCUClient } from '@core/rift/lcu-transport'
import { useGameflowStore } from '@core/state/gameflow-store'

export type ChampSelectPhase = 'ban' | 'pick' | 'post-game'

export type ChampSelectActionType = 'ban' | 'pick' | 'ten_bans_reveal' | string

export type ChampSelectAction = {
  actorCellId: number
  championId: number
  completed: boolean
  id: number
  isAllyAction?: boolean
  isInProgress?: boolean
  type: ChampSelectActionType
}

export type ChampSelectMember = {
  assignedPosition?: string
  cellId: number
  championId: number
  championPickIntent?: number
  displayName?: string
  playerType?: string
  selectedSkinId?: number
  spell1Id?: number
  spell2Id?: number
  summonerId?: number
  team?: number
}

export type ChampSelectTimer = {
  adjustedTimeLeftInPhase?: number
  internalNowInEpochMs?: number
  isInfinite?: boolean
  phase?: string
  totalTimeInPhase?: number
}

export type ChampSelectSession = {
  actions?: ChampSelectAction[][]
  benchChampionIds?: number[]
  benchEnabled?: boolean
  localPlayerCellId?: number
  myTeam?: ChampSelectMember[]
  theirTeam?: ChampSelectMember[]
  timer?: ChampSelectTimer
}

export type ChampSelectStoreState = {
  actions: ChampSelectAction[][]
  benchChampionIds: number[]
  champSelectState: ChampSelectSession | null
  currentAction: ChampSelectAction | null
  error: Error | null
  isMyTurn: boolean
  localPlayerCellId: number | null
  myTeam: ChampSelectMember[]
  phase: ChampSelectPhase
  theirTeam: ChampSelectMember[]
  timer: number
}

export type ChampSelectPatchRequest = (actionId: number, body: ChampSelectActionPatch) => Promise<void>

export type ChampSelectActionPatch = {
  championId: number
  completed: boolean
  type: 'ban' | 'pick'
}

export type ChampSelectStoreActions = {
  banChampion: (championId: number, requestBan?: ChampSelectPatchRequest) => Promise<boolean>
  decrementTimer: () => void
  hoverChampion: (championId: number, requestHover?: ChampSelectPatchRequest) => Promise<boolean>
  pickChampion: (championId: number, requestPick?: ChampSelectPatchRequest) => Promise<boolean>
  reset: () => void
  setChampSelectState: (state: ChampSelectSession | null | undefined) => void
  setError: (error: unknown) => void
}

export type ChampSelectStore = ChampSelectStoreState & ChampSelectStoreActions

export const initialChampSelectState: ChampSelectStoreState = {
  actions: [],
  benchChampionIds: [],
  champSelectState: null,
  currentAction: null,
  error: null,
  isMyTurn: false,
  localPlayerCellId: null,
  myTeam: [],
  phase: 'post-game',
  theirTeam: [],
  timer: 0,
}

const lcuClient = createLCUClient({ connectOnCreate: false })

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }

  if (typeof error === 'string') {
    return new Error(error)
  }

  return new Error('Champ select operation failed.')
}

function normalizeTimer(timer: ChampSelectTimer | null | undefined): number {
  return Math.max(0, Math.ceil((timer?.adjustedTimeLeftInPhase ?? 0) / 1000))
}

function findCurrentTurn(actions: ChampSelectAction[][], timer: ChampSelectTimer | null | undefined): ChampSelectAction[] | null {
  if (timer?.phase !== 'BAN_PICK') {
    return null
  }

  return actions.find((turn) => turn.some((action) => !action.completed && (action.type === 'ban' || action.type === 'pick'))) ?? null
}

function findCurrentAction(actions: ChampSelectAction[][], localPlayerCellId: number | null, timer: ChampSelectTimer | null | undefined) {
  const currentTurn = findCurrentTurn(actions, timer)
  if (!currentTurn || localPlayerCellId === null) {
    return null
  }

  return currentTurn.find((action) => action.actorCellId === localPlayerCellId && !action.completed) ?? null
}

function derivePhase(actions: ChampSelectAction[][], currentAction: ChampSelectAction | null, timer: ChampSelectTimer | null | undefined): ChampSelectPhase {
  if (currentAction?.type === 'ban' || currentAction?.type === 'pick') {
    return currentAction.type
  }

  const currentTurn = findCurrentTurn(actions, timer)
  const turnType = currentTurn?.find((action) => !action.completed && (action.type === 'ban' || action.type === 'pick'))?.type
  return turnType === 'ban' || turnType === 'pick' ? turnType : 'post-game'
}

function replaceAction(actions: ChampSelectAction[][], actionId: number, championId: number, completed: boolean) {
  return actions.map((turn) =>
    turn.map((action) => (action.id === actionId ? { ...action, championId, completed: completed || action.completed } : action)),
  )
}

function updateTeamSelection(team: ChampSelectMember[], cellId: number, championId: number, completed: boolean) {
  return team.map((member) =>
    member.cellId === cellId
      ? {
          ...member,
          championId: completed ? championId : member.championId,
          championPickIntent: completed ? member.championPickIntent : championId,
        }
      : member,
  )
}

async function defaultPatchAction(actionId: number, body: ChampSelectActionPatch): Promise<void> {
  const result = await lcuClient.request(LcuPaths.champSelect.action(actionId), 'PATCH', body)
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`LCU request failed (${result.status}): ${LcuPaths.champSelect.action(actionId)}`)
  }
}

export function createChampSelectStore() {
  return create<ChampSelectStore>()((set, get) => {
    async function commitChampionAction(
      championId: number,
      actionType: 'ban' | 'pick',
      completed: boolean,
      requestAction: ChampSelectPatchRequest = defaultPatchAction,
    ): Promise<boolean> {
      const currentAction = get().currentAction
      if (!currentAction || currentAction.type !== actionType) {
        set({ error: new Error(`No active ${actionType} action for the local player.`) })
        return false
      }

      try {
        await requestAction(currentAction.id, { championId, completed, type: actionType })
        set((state) => {
          const actions = replaceAction(state.actions, currentAction.id, championId, completed)
          const myTeam = updateTeamSelection(state.myTeam, currentAction.actorCellId, championId, completed && actionType === 'pick')
          const nextCurrentAction = completed ? null : { ...currentAction, championId }

          return {
            actions,
            champSelectState: state.champSelectState
              ? {
                  ...state.champSelectState,
                  actions,
                  myTeam,
                }
              : null,
            currentAction: nextCurrentAction,
            error: null,
            isMyTurn: !completed,
            myTeam,
          }
        })
        return true
      } catch (error) {
        set({ error: normalizeError(error) })
        return false
      }
    }

    return {
      ...initialChampSelectState,
      banChampion(championId, requestBan = defaultPatchAction) {
        return commitChampionAction(championId, 'ban', true, requestBan)
      },
      decrementTimer() {
        const current = get()
        if (current.timer <= 0) {
          return
        }

        const timer = Math.max(0, current.timer - 1)
        set((state) => ({
          champSelectState: state.champSelectState
            ? {
                ...state.champSelectState,
                timer: {
                  ...state.champSelectState.timer,
                  adjustedTimeLeftInPhase: timer * 1000,
                },
              }
            : null,
          phase: timer === 0 && state.phase === 'pick' ? 'post-game' : state.phase,
          timer,
        }))
      },
      hoverChampion(championId, requestHover = defaultPatchAction) {
        const currentAction = get().currentAction
        if (!currentAction || (currentAction.type !== 'ban' && currentAction.type !== 'pick')) {
          set({ error: new Error('No active action for the local player.') })
          return Promise.resolve(false)
        }

        return commitChampionAction(championId, currentAction.type, false, requestHover)
      },
      pickChampion(championId, requestPick = defaultPatchAction) {
        return commitChampionAction(championId, 'pick', true, requestPick)
      },
      reset() {
        set({ ...initialChampSelectState })
      },
      setChampSelectState(champSelectState) {
        const actions = champSelectState?.actions ?? []
        const localPlayerCellId = champSelectState?.localPlayerCellId ?? null
        const currentAction = findCurrentAction(actions, localPlayerCellId, champSelectState?.timer)
        const phase = derivePhase(actions, currentAction, champSelectState?.timer)
        const timer = normalizeTimer(champSelectState?.timer)

        set({
          actions,
          benchChampionIds: champSelectState?.benchChampionIds ?? [],
          champSelectState: champSelectState ?? null,
          currentAction,
          error: null,
          isMyTurn: Boolean(currentAction),
          localPlayerCellId,
          myTeam: champSelectState?.myTeam ?? [],
          phase,
          theirTeam: champSelectState?.theirTeam ?? [],
          timer,
        })

        useGameflowStore.getState().setPhase(phase === 'post-game' ? 'postGame' : 'champSelect')
      },
      setError(error) {
        set({ error: normalizeError(error) })
      },
    }
  })
}

export const champSelectRequestPaths = {
  action: LcuPaths.champSelect.action,
  observer: LcuPaths.champSelect.session,
} as const

export const useChampSelectStore = createChampSelectStore()
