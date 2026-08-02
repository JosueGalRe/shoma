import type { ChampionSkin } from '@/core/http/ddragon'

export interface SkinPickerProps {
  championKey: string | null
  onSelectSkin: (skinId: number) => void
  selectedSkinId: number | null
  skins: ChampionSkin[]
}
