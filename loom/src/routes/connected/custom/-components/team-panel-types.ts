import type { CustomGamePlayer } from '@/features/custom/custom-store'

export interface TeamPanelProps {
  team: CustomGamePlayer['team']
  title: string
}
