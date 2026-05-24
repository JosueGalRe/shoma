import type { SpellId as SpellIdType } from '@/core/types/branded'
import type { SummonerSpell } from '../../hooks/use-champ-select'

export interface SpellButtonProps {
  spell: SummonerSpell | null
  ddragonVersion: string | undefined
  label: string
  onClick: () => void
}

export interface SummonerPickerProps {
  summonerSpells: SummonerSpell[]
  selectedSpell1Id: SpellIdType | null
  selectedSpell2Id: SpellIdType | null
  onChangeSpell: (slot: 1 | 2, spellId: SpellIdType) => void
  ddragonVersion: string | undefined
}
