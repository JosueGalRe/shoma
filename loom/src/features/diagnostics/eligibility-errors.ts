import { collectStrings, normalizeCandidate, readAffectedSummoner } from './eligibility-errors-utils'
import type { EligibilityError } from './eligibility-errors-types';
import type { EligibilityErrorDefinition } from './eligibility-errors-types';

const eligibilityErrors: EligibilityErrorDefinition[] = [
  {
    code: 'queue-eligibility-failed',
    messageKey: 'errors.queueEligibilityFailed',
    actionKey: 'actions.selectMode',
    matchers: [/queue(?:[-\s_]+)?eligibility(?:[-\s_]+)?failed/i],
  },
  {
    code: 'missing-roles',
    messageKey: 'errors.missingRoles',
    actionKey: 'actions.selectRoles',
    matchers: [/missing(?:[-\s_]+)?roles?/i, /role(?:[-\s_]+)?selection/i],
  },
  {
    code: 'ranked-restriction',
    messageKey: 'errors.rankedRestriction',
    actionKey: 'actions.checkRanks',
    matchers: [/ranked(?:[-\s_]+)?restriction/i, /rank(?:[-\s_]+)?difference(?:[-\s_]+)?prevents/i, /rank(?:[-\s_]+)?range/i],
  },
  {
    code: 'low-level',
    messageKey: 'errors.lowLevel',
    actionKey: 'actions.levelUp',
    matchers: [/low(?:[-\s_]+)?level/i, /level(?:[-\s_]+)?too(?:[-\s_]+)?low/i, /unlocks?(?:[-\s_]+)?later/i],
  },
  {
    code: 'leaver-penalty',
    messageKey: 'errors.leaverPenalty',
    actionKey: 'actions.waitPenalty',
    matchers: [/leaver(?:[-\s_]+)?penalty/i, /queue(?:[-\s_]+)?penalty/i],
  },
  {
    code: 'insufficient-champions',
    messageKey: 'errors.insufficientChampions',
    actionKey: 'actions.buyChampions',
    matchers: [/insufficient(?:[-\s_]+)?champions/i, /not(?:[-\s_]+)?enough(?:[-\s_]+)?champions/i],
  },
  {
    code: 'invalid-swiftplay-config',
    messageKey: 'errors.invalidSwiftplayConfig',
    actionKey: 'actions.configureSwiftplay',
    matchers: [
      /invalid(?:[-\s_]+)?swiftplay(?:[-\s_]+)?config/i,
      /swiftplay(?:[-\s_]+)?config(?:[-\s_]+)?missing/i,
      /missing(?:[-\s_]+)?swiftplay(?:[-\s_]+)?configuration/i,
    ],
  },
  {
    code: 'client-unavailable',
    messageKey: 'errors.clientUnavailable',
    actionKey: 'actions.restartClient',
    matchers: [/client(?:[-\s_]+)?unavailable/i, /client(?:[-\s_]+)?is(?:[-\s_]+)?not(?:[-\s_]+)?ready/i],
  },
  {
    code: 'invalid-party-size',
    messageKey: 'errors.invalidPartySize',
    actionKey: 'actions.adjustParty',
    matchers: [/invalid(?:[-\s_]+)?party(?:[-\s_]+)?size/i, /party(?:[-\s_]+)?size/i],
  },
  {
    code: 'party-rank-difference',
    messageKey: 'errors.partyRankDifference',
    actionKey: 'actions.adjustParty',
    matchers: [/party(?:[-\s_]+)?rank(?:[-\s_]+)?difference/i, /rank(?:[-\s_]+)?difference(?:[-\s_]+)?too(?:[-\s_]+)?large/i],
  },
  {
    code: 'mode-locked',
    messageKey: 'errors.modeLocked',
    actionKey: 'actions.unlockMode',
    matchers: [/mode.*locked/i, /locked.*mode/i],
  },
  {
    code: 'dodge-penalty',
    messageKey: 'errors.dodgePenalty',
    actionKey: 'actions.waitPenalty',
    matchers: [/dodge(?:[-\s_]+)?penalty/i],
  },
]

export function translateLcuError(lcuError: unknown): EligibilityError | null {
  const rawCandidates = collectStrings(lcuError)
  const candidates = rawCandidates.map(normalizeCandidate)

  for (const definition of eligibilityErrors) {
    if (candidates.some((candidate) => { return definition.matchers.some((matcher) => {return matcher.test(candidate)}); })) {
      return {
        code: definition.code,
        messageKey: definition.messageKey,
        actionKey: definition.actionKey,
        affectedSummoner: readAffectedSummoner(lcuError),
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
