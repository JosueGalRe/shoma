import { collectStrings, normalizeCandidate, readAffectedSummoner } from './eligibility-errors-utils'

import type { EligibilityError, EligibilityErrorDefinition } from './eligibility-errors-types'

const eligibilityErrors: EligibilityErrorDefinition[] = [
  {
    actionKey: 'actions.selectMode',
    code: 'queue-eligibility-failed',
    matchers: [/queue(?:[-\s_]+)?eligibility(?:[-\s_]+)?failed/i],
    messageKey: 'errors.queueEligibilityFailed',
  },
  {
    actionKey: 'actions.selectRoles',
    code: 'missing-roles',
    matchers: [/missing(?:[-\s_]+)?roles?/i, /role(?:[-\s_]+)?selection/i],
    messageKey: 'errors.missingRoles',
  },
  {
    actionKey: 'actions.checkRanks',
    code: 'ranked-restriction',
    matchers: [/ranked(?:[-\s_]+)?restriction/i, /rank(?:[-\s_]+)?difference(?:[-\s_]+)?prevents/i, /rank(?:[-\s_]+)?range/i],
    messageKey: 'errors.rankedRestriction',
  },
  {
    actionKey: 'actions.levelUp',
    code: 'low-level',
    matchers: [/low(?:[-\s_]+)?level/i, /level(?:[-\s_]+)?too(?:[-\s_]+)?low/i, /unlocks?(?:[-\s_]+)?later/i],
    messageKey: 'errors.lowLevel',
  },
  {
    actionKey: 'actions.waitPenalty',
    code: 'leaver-penalty',
    matchers: [/leaver(?:[-\s_]+)?penalty/i, /queue(?:[-\s_]+)?penalty/i],
    messageKey: 'errors.leaverPenalty',
  },
  {
    actionKey: 'actions.buyChampions',
    code: 'insufficient-champions',
    matchers: [/insufficient(?:[-\s_]+)?champions/i, /not(?:[-\s_]+)?enough(?:[-\s_]+)?champions/i],
    messageKey: 'errors.insufficientChampions',
  },
  {
    actionKey: 'actions.configureSwiftplay',
    code: 'invalid-swiftplay-config',
    matchers: [
      /invalid(?:[-\s_]+)?swiftplay(?:[-\s_]+)?config/i,
      /swiftplay(?:[-\s_]+)?config(?:[-\s_]+)?missing/i,
      /missing(?:[-\s_]+)?swiftplay(?:[-\s_]+)?configuration/i,
    ],
    messageKey: 'errors.invalidSwiftplayConfig',
  },
  {
    actionKey: 'actions.restartClient',
    code: 'client-unavailable',
    matchers: [/client(?:[-\s_]+)?unavailable/i, /client(?:[-\s_]+)?is(?:[-\s_]+)?not(?:[-\s_]+)?ready/i],
    messageKey: 'errors.clientUnavailable',
  },
  {
    actionKey: 'actions.adjustParty',
    code: 'invalid-party-size',
    matchers: [/invalid(?:[-\s_]+)?party(?:[-\s_]+)?size/i, /party(?:[-\s_]+)?size/i],
    messageKey: 'errors.invalidPartySize',
  },
  {
    actionKey: 'actions.adjustParty',
    code: 'party-rank-difference',
    matchers: [/party(?:[-\s_]+)?rank(?:[-\s_]+)?difference/i, /rank(?:[-\s_]+)?difference(?:[-\s_]+)?too(?:[-\s_]+)?large/i],
    messageKey: 'errors.partyRankDifference',
  },
  {
    actionKey: 'actions.unlockMode',
    code: 'mode-locked',
    matchers: [/mode.*locked/i, /locked.*mode/i],
    messageKey: 'errors.modeLocked',
  },
  {
    actionKey: 'actions.waitPenalty',
    code: 'dodge-penalty',
    matchers: [/dodge(?:[-\s_]+)?penalty/i],
    messageKey: 'errors.dodgePenalty',
  },
]

export function translateLcuError(lcuError: unknown): EligibilityError | null {
  const rawCandidates = collectStrings(lcuError)
  const candidates = rawCandidates.map(normalizeCandidate)

  for (const definition of eligibilityErrors) {
    if (
      candidates.some((candidate) => {
        return definition.matchers.some((matcher) => {
          return matcher.test(candidate)
        })
      })
    ) {
      return {
        actionKey: definition.actionKey,
        affectedSummoner: readAffectedSummoner(lcuError),
        code: definition.code,
        messageKey: definition.messageKey,
      }
    }
  }

  return null
}

export function getErrorMessageKey(error: EligibilityError): string {
  return error.messageKey
}

export function getErrorActionKey(error: EligibilityError): string {
  return error.actionKey
}
