import type { SummonerSpell } from '@/core/lcu/queries/summoner'
import type { SpellId as SpellIdType } from '@/core/types/branded'

export interface SpellButtonProps {
  compact?: boolean
  spell: SummonerSpell | null
  ddragonVersion: string | undefined
  label: string
  onClick: () => void
}

export interface SummonerPickerProps {
  compact?: boolean
  summonerSpells: SummonerSpell[]
  selectedSpell1Id: SpellIdType | null
  selectedSpell2Id: SpellIdType | null
  onChangeSpell: (slot: 1 | 2, spellId: SpellIdType) => void
  ddragonVersion: string | undefined
}
