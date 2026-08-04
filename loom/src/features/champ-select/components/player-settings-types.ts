import type { RuneTree } from '@/core/http/ddragon'
import type { SummonerSpell } from '@/core/lcu/queries/summoner'
import type { RuneId as RuneIdType, SpellId } from '@/core/types/branded'
import type { ModeRules } from '@/features/modes/mode-engine'

export interface PlayerSettingsProps {
  ddragonVersion: string | undefined
  modeRules: ModeRules
  onChangeSpell: (slot: 1 | 2, spellId: SpellId) => void
  runeTrees: RuneTree[]
  selectedRuneId: RuneIdType | null
  selectedSpell1Id: SpellId | null
  selectedSpell2Id: SpellId | null
  summonerSpells: SummonerSpell[]
}
