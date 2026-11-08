import { describe, expect, test } from 'vitest'

import { parseClashTournaments } from '../../../src/core/lcu/parsers/clash'

describe('lcu clash parsers', () => {
  test('reads TournamentDTO fields from /lol-clash/v1/all-tournaments', () => {
    expect(
      parseClashTournaments([
        {
          id: 3101,
          nameLocKey: 'piltover',
          nameLocKeySecondary: 'day_1',
          queueId: 700,
          scheduleEndTime: 1_794_200_000_000,
          scheduleTime: 1_794_100_000_000,
          themeId: 12,
        },
        'bad',
      ]),
    ).toEqual([
      {
        id: 3101,
        nameLocKey: 'piltover',
        nameLocKeySecondary: 'day_1',
        scheduleEndTime: 1_794_200_000_000,
        scheduleTime: 1_794_100_000_000,
        themeId: 12,
      },
    ])
  })

  test('returns an empty list for non-array payloads', () => {
    expect(parseClashTournaments(null)).toEqual([])
    expect(parseClashTournaments({ tournaments: [] })).toEqual([])
  })
})
