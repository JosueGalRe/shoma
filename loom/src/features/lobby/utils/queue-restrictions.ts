import type { QueueRestriction } from '@/core/lcu/parsers/lobby'

// The client's messages for Swift Play's and Arena's restrictions (rcp-fe-lol-parties), in the order it picks one to show
const RESTRICTION_MESSAGES = [
  ['QPScarcePositionsNotAvailableRestriction', 'scarcePositionsNotAvailable'],
  ['QPPlayerScarcePositionCoverageRestriction', 'scarcePositionCoverage'],
  ['QPNonUniquePrimarySlotRestriction', 'nonUniquePrimarySlot'],
  ['QPNonUniquePrimarySlotPositionRestriction', 'nonUniquePrimarySlotPosition'],
  ['QPNonUniquePrimarySlotChampionRestriction', 'nonUniquePrimarySlotChampion'],
  ['QPPartyChampionCoverageRestriction', 'partyChampionCoverage'],
  ['QPPartyPositionCoverageRestriction', 'partyPositionCoverage'],
  ['QPPlayerChampionCoverageRestriction', 'playerChampionCoverage'],
  ['QPPlayerPositionCoverageRestriction', 'playerPositionCoverage'],
  ['QPInvalidNumberOfPlayerSlotsRestriction', 'invalidNumberOfPlayerSlots'],
  ['QPInvalidPositionSelectionRestriction', 'invalidPositionSelection'],
  ['QPInvalidChampionSelectionRestriction', 'invalidChampionSelection'],
  ['QPInsufficientPlayerChampionCoveragePopularChampion', 'popularChampionCoverage'],
  ['TooManyIncompleteSubteamsRestriction', 'incompleteSubteams'],
] as const

export type QueueRestrictionMessage =
  | (typeof RESTRICTION_MESSAGES)[number][1]
  | 'generic'
  // The priority position one when it is about the local player
  | 'scarcePositionCoverageSelf'

// The one message the client shows for the lobby's restrictions; codes it has no Swift Play message for read as generic
export function getQueueRestrictionMessage(
  restrictions: readonly QueueRestriction[],
  localSummonerId: number | undefined,
): QueueRestrictionMessage | null {
  if (restrictions.length === 0) {
    return null
  }

  for (const [code, message] of RESTRICTION_MESSAGES) {
    const restriction = restrictions.find((each) => {
      return each.code === code
    })

    if (restriction) {
      const isSelf = localSummonerId !== undefined && restriction.summonerIds.includes(localSummonerId)

      return message === 'scarcePositionCoverage' && isSelf ? 'scarcePositionCoverageSelf' : message
    }
  }

  return 'generic'
}
