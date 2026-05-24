import type { TFunction } from 'i18next'

type RelayStatus = 'connected' | 'connecting' | 'disconnected' | 'error' | 'idle'

const PAGE_HEADER_STATUS_LABEL_KEYS: Record<RelayStatus, string> = {
  connected: 'connection.status.connected',
  connecting: 'connection.status.connecting',
  disconnected: 'connection.status.disconnected',
  error: 'connection.status.error',
  idle: 'connection.status.idle',
}

const PAGE_HEADER_STATUS_COLORS: Record<RelayStatus, string> = {
  connected: 'bg-[rgb(200,170,110)]',
  connecting: 'bg-accent',
  disconnected: 'bg-accent',
  error: 'bg-destructive',
  idle: 'bg-accent',
}

export function getPageHeaderStatusLabel(status: RelayStatus, t: TFunction) {
  return t(PAGE_HEADER_STATUS_LABEL_KEYS[status])
}

export function getPageHeaderStatusColor(status: RelayStatus) {
  return PAGE_HEADER_STATUS_COLORS[status]
}
