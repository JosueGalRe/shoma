import { describe, expect, it } from 'vitest'

import { CellId, ChampionId } from '@/core/types/branded'

import { readChampSelectStage, toggleSpell } from './champ-select-screen-utils'

import type { ChampSelectAction, ChampSelectSession } from '@/features/champ-select/champ-select-actions'

const LOCAL = 2

function action(id: number, cellId: number, type: ChampSelectAction['type']): ChampSelectAction {
  return {
    actorCellId: CellId(cellId),
    championId: ChampionId(0),
    completed: false,
    id,
    isAllyAction: cellId < 5,
    isInProgress: false,
    type,
  }
}

function done(pending: ChampSelectAction): ChampSelectAction {
  return { ...pending, championId: ChampionId(pending.id), completed: true }
}

function session(phase: string, actions: ChampSelectAction[][]): ChampSelectSession {
  return { actions, localPlayerCellId: CellId(LOCAL), timer: { phase } }
}

function bans(isDone: (cellId: number) => boolean) {
  return [0, 1, 2, 5, 6].map((cellId) => {
    const ban = action(cellId + 1, cellId, 'ban')

    return isDone(cellId) ? done(ban) : ban
  })
}

function none() {
  return false
}

function all() {
  return true
}

function onlyLocal(cellId: number) {
  return cellId === LOCAL
}

function allies(cellId: number) {
  return cellId < 5
}

const picks = [[action(20, 0, 'pick')], [action(21, 5, 'pick'), action(22, 6, 'pick')], [action(23, LOCAL, 'pick')]]

describe('readChampSelectStage', () => {
  it('follows a draft from planning to finalization', () => {
    const reveal = { ...action(10, -1, 'ten_bans_reveal'), isInProgress: true }
    const myTurn = [bans(all), [done(action(20, 0, 'pick'))], [done(action(21, 5, 'pick'))], [action(23, LOCAL, 'pick')]]
    const locked = [bans(all), [done(action(23, LOCAL, 'pick'))], [action(21, 5, 'pick')]]

    expect(readChampSelectStage(null)).toBe('planning')
    expect(readChampSelectStage(session('PLANNING', [bans(none), ...picks]))).toBe('planning')
    expect(readChampSelectStage(session('BAN_PICK', [bans(none), ...picks]))).toBe('ban')
    expect(readChampSelectStage(session('BAN_PICK', [bans(onlyLocal), ...picks]))).toBe('bans-allies')
    expect(readChampSelectStage(session('BAN_PICK', [bans(allies), ...picks]))).toBe('bans-enemies')
    expect(readChampSelectStage(session('BAN_PICK', [bans(all), [reveal], ...picks]))).toBe('bans-revealed')
    expect(readChampSelectStage(session('BAN_PICK', [bans(all), ...picks]))).toBe('declare')
    expect(readChampSelectStage(session('BAN_PICK', myTurn))).toBe('pick')
    expect(readChampSelectStage(session('BAN_PICK', locked))).toBe('locked')
    expect(readChampSelectStage(session('FINALIZATION', locked))).toBe('finalization')
    expect(readChampSelectStage(session('GAME_STARTING', locked))).toBe('finalization')
  })
})

describe('toggleSpell', () => {
  it('fills the empty key, frees a picked one and swaps F when both are taken', () => {
    expect(toggleSpell([0, 0], 4)).toEqual([4, 0])
    expect(toggleSpell([4, 0], 14)).toEqual([4, 14])
    expect(toggleSpell([4, 14], 4)).toEqual([0, 14])
    expect(toggleSpell([0, 14], 7)).toEqual([7, 14])
    expect(toggleSpell([4, 14], 7)).toEqual([4, 7])
  })
})
