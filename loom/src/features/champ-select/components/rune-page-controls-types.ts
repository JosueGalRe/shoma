import type { PerkPage } from '@/core/lcu/parsers/perks'

export interface RunePageControlsProps {
  pages: PerkPage[]
  currentPageId: number | null
  onSetCurrentPage: (pageId: number) => void
  onCreatePage: () => void
  onDeletePage: () => void
}
