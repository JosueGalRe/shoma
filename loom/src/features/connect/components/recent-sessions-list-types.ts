import type { RecentSession } from '../recent-sessions-store'

export interface RecentSessionsListProps {
  onReconnect: (code: string) => void
  onRemove: (code: string) => void
  sessions: RecentSession[]
}
