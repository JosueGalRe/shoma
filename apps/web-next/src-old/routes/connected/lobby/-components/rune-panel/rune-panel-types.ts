import type { ConnectedRunePage, RuneStyle } from '../../-lobby-runes'

export interface ConnectedRunePanelProps {
  title: string
  createLabel: string
  renameLabel: string
  renamePlaceholder: string
  deleteLabel: string
  noRunesLabel: string
  primaryTreeLabel: string
  secondaryTreeLabel: string
  statShardsLabel: string
  selectEditableHintLabel: string
  noEditorDataLabel: string
  runePages: ConnectedRunePage[]
  activeRunePage: ConnectedRunePage | null
  editableActiveRunePage: ConnectedRunePage | null
  primaryRuneStyle: RuneStyle | null
  secondaryRuneStyle: RuneStyle | null
  runeStyles: RuneStyle[]
  selectedSecondaryRuneIds: number[]
  runePageActionPending: boolean
  runeUpdatePending: boolean
  runeEditPending: boolean
  runePageNameDraft: string
  onRunePageNameDraftChange: (value: string) => void
  onCreateRunePage: () => void
  onRenameActiveRunePage: () => void
  onDeleteActiveRunePage: () => void
  onSelectRunePage: (id: number) => void
  onSelectPrimaryRuneStyle: (styleId: number) => void
  onSelectPrimaryRune: (slotIndex: number, runeId: number) => void
  onSelectSecondaryRuneStyle: (styleId: number) => void
  onSelectSecondaryRune: (runeId: number, style: RuneStyle | null) => void
  onSelectStatShard: (slotIndex: number, runeId: number) => void
}
