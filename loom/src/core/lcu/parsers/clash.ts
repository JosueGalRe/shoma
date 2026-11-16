import { boolean, fallback, type InferInput, object, optional, string } from 'valibot'

import { finiteNumber, parseOrNull, unknownArray } from './base'

import type { ClashChatRoster, ClashTournament } from './clash-types'
import type { AssertSchemaContract, SchemaContractViolations } from './schema-contract'
import type { LCUTypes } from '@shoma/protocol-contract'

const ClashTournamentSchema = object({
  id: optional(finiteNumber),
  nameLocKey: optional(string()),
  nameLocKeySecondary: optional(string()),
  scheduleEndTime: optional(finiteNumber),
  scheduleTime: optional(finiteNumber),
  themeId: optional(finiteNumber),
})

export function parseClashTournaments(content: unknown): ClashTournament[] {
  return (parseOrNull(unknownArray, content) ?? []).flatMap((entry): ClashTournament[] => {
    const parsed = parseOrNull(ClashTournamentSchema, entry)

    return parsed ? [parsed] : []
  })
}

const ClashChatRosterSchema = object({
  iconColorId: fallback(optional(finiteNumber), undefined),
  iconId: fallback(optional(finiteNumber), undefined),
  isRegistered: fallback(optional(boolean()), false),
  multiUserChatId: string(),
  name: fallback(optional(string()), ''),
  shortName: fallback(optional(string()), ''),
})

export function parseClashChatRosters(content: unknown): ClashChatRoster[] {
  return (parseOrNull(unknownArray, content) ?? []).flatMap((entry): ClashChatRoster[] => {
    const roster = parseOrNull(ClashChatRosterSchema, entry)

    return roster && roster.multiUserChatId !== ''
      ? [
          {
            iconColorId: roster.iconColorId,
            iconId: roster.iconId,
            isRegistered: roster.isRegistered ?? false,
            multiUserChatId: roster.multiUserChatId,
            name: roster.name ?? '',
            shortName: roster.shortName ?? '',
          },
        ]
      : []
  })
}

// Contracts with the generated LCU schema; see ./schema-contract
export type ClashTournamentSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof ClashTournamentSchema>, LCUTypes.TournamentDTO>
>

export type ClashChatRosterSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof ClashChatRosterSchema>, LCUTypes.LolClashPlayerChatRoster>
>
