import type { RuneTree, useChampions } from '@/core/http/ddragon-client';
import type { SummonerSpell } from '@/features/champ-select'
import type { SwiftplayOption } from '@/features/swiftplay/swiftplay-store'

export interface OptionCardProps {
  champions: Awaited<ReturnType<typeof useChampions>>['data']
  ddragonVersion: string | undefined
  isLoading: boolean
  option: SwiftplayOption
  optionIndex: 1 | 2
  runeTrees: RuneTree[]
  summonerSpells: SummonerSpell[]
}
