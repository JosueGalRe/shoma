export interface RecentSessionsListProps {
  onReconnect: (code: string) => void
  sessions: string[]
}
