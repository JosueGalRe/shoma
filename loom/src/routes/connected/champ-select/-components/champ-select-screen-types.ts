import type { ChampSelectStage } from './champ-select-screen-utils'
import type { ChampionSkin } from '@/core/lcu/parsers/skins'
import type { ChampSelectMember, UseChampSelectResult } from '@/features/champ-select'

export type ChampSelectTab = 'champion' | 'picks' | 'rune' | 'spell' | 'ward'

export interface ChampSelectPanelProps {
  // The "Bottom Action" between the teams and the tabs, where the panel puts its button
  actionSlot: HTMLElement | null
  champSelect: UseChampSelectResult
}

export interface ChampionPanelProps extends ChampSelectPanelProps {
  onOpenAram: () => void
  stage: ChampSelectStage
}

export interface ChampionPickPanelProps extends ChampSelectPanelProps {
  stage: ChampSelectStage
}

export interface BansPanelProps {
  champSelect: UseChampSelectResult
  stage: ChampSelectStage
}

export interface BannedChampionProps {
  // Null while the ban is still to come, or when the player banned nothing
  championId: number | null
  name: string
}

export interface PicksPanelProps extends ChampSelectPanelProps {
  onOpenTab: (tab: ChampSelectTab) => void
}

export interface ChampSelectActionProps {
  disabled: boolean
  label: string
  onClick: () => void
  slot: HTMLElement | null
}

export interface ChampSelectHeaderProps {
  secondsLeft: number
  secondsTotal: number
  title: string
  tone: 'ban' | 'pick'
}

export interface TeamStripProps {
  champSelect: UseChampSelectResult
  onOpenChange: (open: boolean) => void
  open: boolean
}

export interface AssignedPositionsProps {
  localCellId: number | null
  mapUrl: string | undefined
  members: readonly ChampSelectMember[]
  open: boolean
}

export interface SkinPanelProps {
  champSelect: UseChampSelectResult
}

export interface ChromaPickerProps {
  onPick: (skinId: number) => void
  // The skin in the carousel's middle
  skin: ChampionSkin
  // The picked skin or chroma
  value: number
}

export interface SkinCarouselProps {
  label: string
  onPick: (skinId: number) => void
  skins: readonly ChampionSkin[]
  value: number
}
