import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, test } from 'vitest'

import { parseChampSelectSession } from '../../../src/core/lcu/parsers/champ-select'
import { deriveChampSelectState } from '../../../src/features/champ-select/champ-select-actions'

// Contract tests: the parser and the slim domain model must accept the real LCU
// payloads captured from a live client (patch 16.12). See fixtures README for the
// contract findings these tests lock in.
const fixturesDir = resolve(process.cwd(), 'tests/fixtures/champ-select')

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(`${fixturesDir}/${name}`, 'utf8'))
}

describe('champ-select contract (captured payloads)', () => {
  test('every captured session fixture parses', () => {
    const sessionFixtures = readdirSync(fixturesDir).filter((name) => {
      return /session.*\.json$/.test(name) && !name.startsWith('tb-')
    })

    expect(sessionFixtures.length).toBeGreaterThan(20)

    for (const name of sessionFixtures) {
      expect(parseChampSelectSession(loadFixture(name)), name).not.toBeNull()
    }
  })

  test('normal draft PLANNING: 2D actions, ten_bans_reveal group, obfuscated enemies', () => {
    const session = parseChampSelectSession(loadFixture('20260802-202813-session.json'))

    expect(session).not.toBeNull()
    expect(session?.queueId).toBe(400)
    expect(session?.localPlayerCellId).toBe(7)
    expect(session?.timer.phase).toBe('PLANNING')

    const actions = session?.actions ?? []
    expect(actions).toHaveLength(8)
    expect(actions[1]?.[0]?.type).toBe('ten_bans_reveal')
    expect(actions[0]).toHaveLength(10)

    for (const enemy of session?.theirTeam ?? []) {
      expect(enemy.gameName).toBe('')
      expect(enemy.summonerId).toBe(0)
    }
  })

  test('ranked FINALIZATION: completed bans live in actions, -1 is an intentional no-ban', () => {
    const session = parseChampSelectSession(loadFixture('20260803-213145-session-finalization-30.json'))

    expect(session).not.toBeNull()
    expect(session?.queueId).toBe(420)
    expect(session?.timer.phase).toBe('FINALIZATION')

    const bans = (session?.actions ?? []).flat().filter((action) => {
      return action.type === 'ban'
    })
    expect(bans).toHaveLength(10)
    expect(bans.every((ban) => ban.completed)).toBe(true)

    const noBanVote = bans.find((ban) => ban.actorCellId === 4)
    expect(noBanVote?.championId).toBe(-1)

    const reveal = (session?.actions ?? []).flat().find((action) => {
      return action.type === 'ten_bans_reveal'
    })
    expect(reveal?.completed).toBe(true)

    // The slim domain model derives bans from actions, excluding 0 (not acted) and -1 (no-ban)
    const derived = deriveChampSelectState(session)
    expect(derived.bannedChampions).toHaveLength(9)
    expect(derived.bannedChampions).toContain(950)
    expect(derived.bannedChampions).not.toContain(-1)
  })

  test('ARAM FINALIZATION: benchChampions are objects, no ban actions, reroll flags', () => {
    const session = parseChampSelectSession(loadFixture('20260803-104306-session-finalization-10.json'))

    expect(session).not.toBeNull()
    expect(session?.queueId).toBe(2400)
    expect(session?.benchEnabled).toBe(true)
    expect(session?.allowRerolling).toBe(true)
    expect(session?.rerollsRemaining).toBe(0)

    const bench = session?.benchChampions ?? []
    expect(bench).toHaveLength(9)
    for (const entry of bench) {
      expect(typeof entry.championId).toBe('number')
      expect(entry.isPriority).toBe(false)
    }

    const actionTypes = new Set(
      (session?.actions ?? []).flat().map((action) => {
        return action.type
      }),
    )
    expect(actionTypes).toEqual(new Set(['pick']))

    const derived = deriveChampSelectState(session)
    expect(derived.benchChampionIds).toHaveLength(9)
  })

  test('GAME_STARTING: fourth timer phase, trades emptied', () => {
    const session = parseChampSelectSession(loadFixture('20260803-104322-session-game-starting-13.json'))

    expect(session).not.toBeNull()
    expect(session?.timer.phase).toBe('GAME_STARTING')
    expect(session?.trades).toEqual([])
  })
})
