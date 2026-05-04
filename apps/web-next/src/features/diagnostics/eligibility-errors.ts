export type EligibilityErrorCode =
  | 'low-level'
  | 'insufficient-champions'
  | 'ranked-restriction'
  | 'dodge-penalty'
  | 'missing-roles'
  | 'invalid-party-size'
  | 'mode-locked'
  | 'client-unavailable'
  | 'queue-eligibility-failed'
  | 'leaver-penalty'
  | 'invalid-swiftplay-config'
  | 'party-rank-difference'

export type EligibilityError = {
  code: EligibilityErrorCode
  messageKey: string
  actionKey: string
  affectedSummoner?: string
}

type EligibilityErrorDefinition = Omit<EligibilityError, 'affectedSummoner'> & {
  matchers: RegExp[]
}

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

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function readObject(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
}

function collectStrings(value: unknown, seen = new Set<unknown>()): string[] {
  if (typeof value === 'string') {
    return [value]
  }

  if (typeof value !== 'object' || value === null || seen.has(value)) {
    return []
  }

  seen.add(value)
  const record = value as Record<string, unknown>
  return Object.values(record).flatMap((entry) => collectStrings(entry, seen))
}

function readAffectedSummoner(value: unknown): string | undefined {
  const record = readObject(value)
  if (!record) {
    return undefined
  }

  return (
    readString(record.affectedSummoner) ??
    readString(record.summonerName) ??
    readString(record.displayName) ??
    readString(record.fromSummonerName) ??
    readString(record.playerName)
  ) ?? undefined
}

function normalizeCandidate(value: string): string {
  return value.trim().toLowerCase()
}

export function translateLcuError(lcuError: unknown): EligibilityError | null {
  const rawCandidates = collectStrings(lcuError)
  const candidates = rawCandidates.map(normalizeCandidate)

  for (const definition of eligibilityErrors) {
    if (candidates.some((candidate) => definition.matchers.some((matcher) => matcher.test(candidate)))) {
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
