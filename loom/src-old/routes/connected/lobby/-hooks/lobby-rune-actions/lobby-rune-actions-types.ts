import type { QueryClient } from '@tanstack/react-query'

import type { LcuClient } from '@core/rift/lcu-client'
import type { RiftClientState } from '@core/rift/rift-client-types'

import type { ConnectedRunePage, RuneStyle } from '../../-lobby-runes'

export type EditableRunePagePayload = {
  [key: string]: unknown
  selectedPerkIds: number[]
}

export type UseLobbyRuneActionsOptions = {
  status: RiftClientState | null
  lcuClient: LcuClient
  queryClient: QueryClient
  appendLog: (message: string) => void
  runeEditPending: boolean
  setRuneEditPending: (value: boolean) => void
  runePageActionPending: boolean
  setRunePageActionPending: (value: boolean) => void
  runeUpdatePending: boolean
  setRuneUpdatePending: (value: boolean) => void
  secondaryRuneSelectionIndex: number
  setSecondaryRuneSelectionIndex: (value: number) => void
  editableActiveRunePage: ConnectedRunePage | null
  activeRunePage: ConnectedRunePage | null
  runeStyles: RuneStyle[]
  runePages: ConnectedRunePage[]
  runePageNameDraft: string
  buildNewRunePageName: (nextIndex: number) => string
  buildDeleteConfirmMessage: (name: string) => string
  confirm: (message: string) => boolean
}
