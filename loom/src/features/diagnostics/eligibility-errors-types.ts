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

export type EligibilityErrorDefinition = Omit<EligibilityError, 'affectedSummoner'> & {
  matchers: RegExp[]
}
