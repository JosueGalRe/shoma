import { array, boolean, fallback, type InferOutput, looseObject, object, picklist, record, string, unknown } from 'valibot'

import { finiteNumber, parseObjectOrNull } from './base'

// The generated LCU types give settings bodies as `unknown`, so these schemas have no contract

// The client writes the whole body back, so the spells stored beside the skins are kept as they come
const ChampSelectSettingsSchema = object({
  data: fallback(
    object({ skins: fallback(record(string(), finiteNumber), {}), spells: fallback(record(string(), unknown()), {}) }),
    { skins: {}, spells: {} },
  ),
  schemaVersion: fallback(finiteNumber, 1),
})

export type ChampSelectSettings = InferOutput<typeof ChampSelectSettingsSchema>

// The last skin the player took each champion into a game with, keyed by champion id
export function parseChampSelectSettings(content: unknown): ChampSelectSettings | null {
  return parseObjectOrNull(ChampSelectSettingsSchema, content)
}

// The friend list's options (/lol-chat/v1/settings). The client writes the whole body back, so its other keys are kept
const ChatSettingsSchema = looseObject({
  // "Group Games and Servers"
  chatGBG: fallback(boolean(), false),
  chatGroupMobile: fallback(boolean(), false),
  chatGroupOffline: fallback(boolean(), false),
  // The client sorts by availability when it's unset
  sortBy: fallback(picklist(['alphabetical', 'availability']), 'availability'),
})

export type ChatSettings = InferOutput<typeof ChatSettingsSchema>

export function parseChatSettings(content: unknown): ChatSettings | null {
  return parseObjectOrNull(ChatSettingsSchema, content)
}

const ChampSelectPreferencesSchema = object({
  data: fallback(object({ favorites: fallback(record(string(), fallback(array(finiteNumber), [])), {}) }), { favorites: {} }),
})

// The champions the player marked as favorite for any position
export function parseFavoriteChampionIds(content: unknown): Set<number> {
  const favorites = parseObjectOrNull(ChampSelectPreferencesSchema, content)?.data.favorites ?? {}

  return new Set(Object.values(favorites).flat())
}
