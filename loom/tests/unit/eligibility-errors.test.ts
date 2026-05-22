import { describe, expect, test } from 'bun:test'

import {
  type EligibilityErrorCode,
  getErrorActionKey,
  getErrorMessageKey,
  translateLcuError,
} from '../../src/features/diagnostics/eligibility-errors'

type EligibilityCase = readonly [string, EligibilityErrorCode, string, string]

const cases: EligibilityCase[] = [
  ['Queue eligibility failed', 'queue-eligibility-failed', 'errors.queueEligibilityFailed', 'actions.selectMode'],
  ['Missing role selection', 'missing-roles', 'errors.missingRoles', 'actions.selectRoles'],
  ['Rank difference prevents playing this mode', 'ranked-restriction', 'errors.rankedRestriction', 'actions.checkRanks'],
  ['This mode unlocks later', 'low-level', 'errors.lowLevel', 'actions.levelUp'],
  ['A player has a queue penalty', 'leaver-penalty', 'errors.leaverPenalty', 'actions.waitPenalty'],
  [
    'Not enough champions available for ranked',
    'insufficient-champions',
    'errors.insufficientChampions',
    'actions.buyChampions',
  ],
  [
    'Missing Swiftplay configuration',
    'invalid-swiftplay-config',
    'errors.invalidSwiftplayConfig',
    'actions.configureSwiftplay',
  ],
  ['League client is not ready', 'client-unavailable', 'errors.clientUnavailable', 'actions.restartClient'],
  ['Party size is invalid for this mode', 'invalid-party-size', 'errors.invalidPartySize', 'actions.adjustParty'],
  ['Party rank difference is too large', 'party-rank-difference', 'errors.partyRankDifference', 'actions.adjustParty'],
  ['This mode is locked', 'mode-locked', 'errors.modeLocked', 'actions.unlockMode'],
  ['Dodge penalty active', 'dodge-penalty', 'errors.dodgePenalty', 'actions.waitPenalty'],
] as const

describe('eligibility errors', () => {
  for (const [message, code, messageKey, actionKey] of cases) {
    test(`maps ${message}`, () => {
      const error = translateLcuError({ message, affectedSummoner: 'Bryan' })

      expect(error).toEqual({
        code,
        messageKey,
        actionKey,
        affectedSummoner: 'Bryan',
      })
      if (!error) {
        throw new Error('Expected an eligibility error')
      }

      expect(getErrorMessageKey(error)).toBe(messageKey)
      expect(getErrorActionKey(error)).toBe(actionKey)
    })
  }

  test('returns null for unknown errors', () => {
    expect(translateLcuError({ message: 'something unrelated' })).toBeNull()
    expect(translateLcuError('no match here')).toBeNull()
  })

  test('preserves affected summoner from the source payload', () => {
    expect(
      translateLcuError({
        errorCode: 'queue eligibility failed',
        fromSummonerName: 'Bryan',
      }),
    ).toEqual({
      code: 'queue-eligibility-failed',
      messageKey: 'errors.queueEligibilityFailed',
      actionKey: 'actions.selectMode',
      affectedSummoner: 'Bryan',
    })
  })
})
