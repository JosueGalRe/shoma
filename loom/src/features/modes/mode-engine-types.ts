export type GameMode =
  | 'ranked-solo-duo'
  | 'ranked-flex'
  | 'normal-draft'
  | 'swiftplay'
  | 'aram'
  | 'arena'
  | 'clash'
  | 'custom'
  | 'coop-vs-ai'

export interface ModeRules {
  requiresRoleSelection: boolean
  hasChampSelect: boolean
  hasBans: boolean
  hasSimultaneousBans: boolean
  hasBench: boolean
  usesRunes: boolean
  usesSummonerSpells: boolean
  allowsTrades: boolean
  allowsSwaps: boolean
  hasPreselect: boolean
  maxPartySize: number
  minPartySize: number
  botSupport: boolean
  spectatorSupport: boolean
}
