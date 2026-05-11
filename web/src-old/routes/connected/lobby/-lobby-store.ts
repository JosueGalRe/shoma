import { create } from 'zustand'

type StateUpdater<T> = T | ((previous: T) => T)

type ConnectedUiState = {
  readyCheckPending: boolean
  inviteActionPendingById: Record<string, boolean>
  memberActionPendingById: Record<number, boolean>
  lobbyActionPending: boolean
  selectedQueueId: string
  showInvitePanel: boolean
  inviteName: string
  inviteSubmissionPending: boolean
  firstRoleDraft: string
  secondRoleDraft: string
  roleUpdatePending: boolean
  championActionPending: boolean
  championSelectionDraft: string
  rerollPending: boolean
  benchSwapPendingId: number | null
  spellUpdatePending: boolean
  skinUpdatePending: boolean
  runeUpdatePending: boolean
  runePageActionPending: boolean
  runeEditPending: boolean
  secondaryRuneSelectionIndex: number
  selectedSpell1Draft: string
  selectedSpell2Draft: string
  selectedSkinDraft: string
  runePageNameDraft: string
  installPromptAvailable: boolean
  isStandaloneMode: boolean
}

type ConnectedUiActions = {
  setReadyCheckPending: (value: StateUpdater<boolean>) => void
  setInviteActionPendingById: (value: StateUpdater<Record<string, boolean>>) => void
  setMemberActionPendingById: (value: StateUpdater<Record<number, boolean>>) => void
  setLobbyActionPending: (value: StateUpdater<boolean>) => void
  setSelectedQueueId: (value: StateUpdater<string>) => void
  setShowInvitePanel: (value: StateUpdater<boolean>) => void
  setInviteName: (value: StateUpdater<string>) => void
  setInviteSubmissionPending: (value: StateUpdater<boolean>) => void
  setFirstRoleDraft: (value: StateUpdater<string>) => void
  setSecondRoleDraft: (value: StateUpdater<string>) => void
  setRoleUpdatePending: (value: StateUpdater<boolean>) => void
  setChampionActionPending: (value: StateUpdater<boolean>) => void
  setChampionSelectionDraft: (value: StateUpdater<string>) => void
  setRerollPending: (value: StateUpdater<boolean>) => void
  setBenchSwapPendingId: (value: StateUpdater<number | null>) => void
  setSpellUpdatePending: (value: StateUpdater<boolean>) => void
  setSkinUpdatePending: (value: StateUpdater<boolean>) => void
  setRuneUpdatePending: (value: StateUpdater<boolean>) => void
  setRunePageActionPending: (value: StateUpdater<boolean>) => void
  setRuneEditPending: (value: StateUpdater<boolean>) => void
  setSecondaryRuneSelectionIndex: (value: StateUpdater<number>) => void
  setSelectedSpell1Draft: (value: StateUpdater<string>) => void
  setSelectedSpell2Draft: (value: StateUpdater<string>) => void
  setSelectedSkinDraft: (value: StateUpdater<string>) => void
  setRunePageNameDraft: (value: StateUpdater<string>) => void
  setInstallPromptAvailable: (value: StateUpdater<boolean>) => void
  setIsStandaloneMode: (value: StateUpdater<boolean>) => void
  resetConnectedUiState: () => void
}

const initialConnectedUiState: ConnectedUiState = {
  readyCheckPending: false,
  inviteActionPendingById: {},
  memberActionPendingById: {},
  lobbyActionPending: false,
  selectedQueueId: '',
  showInvitePanel: false,
  inviteName: '',
  inviteSubmissionPending: false,
  firstRoleDraft: 'UNSELECTED',
  secondRoleDraft: 'UNSELECTED',
  roleUpdatePending: false,
  championActionPending: false,
  championSelectionDraft: '',
  rerollPending: false,
  benchSwapPendingId: null,
  spellUpdatePending: false,
  skinUpdatePending: false,
  runeUpdatePending: false,
  runePageActionPending: false,
  runeEditPending: false,
  secondaryRuneSelectionIndex: 0,
  selectedSpell1Draft: '',
  selectedSpell2Draft: '',
  selectedSkinDraft: '',
  runePageNameDraft: '',
  installPromptAvailable: false,
  isStandaloneMode: false,
}

function resolveStateUpdater<T>(value: StateUpdater<T>, previous: T): T {
  if (typeof value === 'function') {
    return (value as (previous: T) => T)(previous)
  }

  return value
}

export const useConnectedUiStore = create<ConnectedUiState & ConnectedUiActions>()((set) => ({
  ...initialConnectedUiState,
  setReadyCheckPending(value) {
    set((state) => ({ readyCheckPending: resolveStateUpdater(value, state.readyCheckPending) }))
  },
  setInviteActionPendingById(value) {
    set((state) => ({ inviteActionPendingById: resolveStateUpdater(value, state.inviteActionPendingById) }))
  },
  setMemberActionPendingById(value) {
    set((state) => ({ memberActionPendingById: resolveStateUpdater(value, state.memberActionPendingById) }))
  },
  setLobbyActionPending(value) {
    set((state) => ({ lobbyActionPending: resolveStateUpdater(value, state.lobbyActionPending) }))
  },
  setSelectedQueueId(value) {
    set((state) => ({ selectedQueueId: resolveStateUpdater(value, state.selectedQueueId) }))
  },
  setShowInvitePanel(value) {
    set((state) => ({ showInvitePanel: resolveStateUpdater(value, state.showInvitePanel) }))
  },
  setInviteName(value) {
    set((state) => ({ inviteName: resolveStateUpdater(value, state.inviteName) }))
  },
  setInviteSubmissionPending(value) {
    set((state) => ({ inviteSubmissionPending: resolveStateUpdater(value, state.inviteSubmissionPending) }))
  },
  setFirstRoleDraft(value) {
    set((state) => ({ firstRoleDraft: resolveStateUpdater(value, state.firstRoleDraft) }))
  },
  setSecondRoleDraft(value) {
    set((state) => ({ secondRoleDraft: resolveStateUpdater(value, state.secondRoleDraft) }))
  },
  setRoleUpdatePending(value) {
    set((state) => ({ roleUpdatePending: resolveStateUpdater(value, state.roleUpdatePending) }))
  },
  setChampionActionPending(value) {
    set((state) => ({ championActionPending: resolveStateUpdater(value, state.championActionPending) }))
  },
  setChampionSelectionDraft(value) {
    set((state) => ({ championSelectionDraft: resolveStateUpdater(value, state.championSelectionDraft) }))
  },
  setRerollPending(value) {
    set((state) => ({ rerollPending: resolveStateUpdater(value, state.rerollPending) }))
  },
  setBenchSwapPendingId(value) {
    set((state) => ({ benchSwapPendingId: resolveStateUpdater(value, state.benchSwapPendingId) }))
  },
  setSpellUpdatePending(value) {
    set((state) => ({ spellUpdatePending: resolveStateUpdater(value, state.spellUpdatePending) }))
  },
  setSkinUpdatePending(value) {
    set((state) => ({ skinUpdatePending: resolveStateUpdater(value, state.skinUpdatePending) }))
  },
  setRuneUpdatePending(value) {
    set((state) => ({ runeUpdatePending: resolveStateUpdater(value, state.runeUpdatePending) }))
  },
  setRunePageActionPending(value) {
    set((state) => ({ runePageActionPending: resolveStateUpdater(value, state.runePageActionPending) }))
  },
  setRuneEditPending(value) {
    set((state) => ({ runeEditPending: resolveStateUpdater(value, state.runeEditPending) }))
  },
  setSecondaryRuneSelectionIndex(value) {
    set((state) => ({ secondaryRuneSelectionIndex: resolveStateUpdater(value, state.secondaryRuneSelectionIndex) }))
  },
  setSelectedSpell1Draft(value) {
    set((state) => ({ selectedSpell1Draft: resolveStateUpdater(value, state.selectedSpell1Draft) }))
  },
  setSelectedSpell2Draft(value) {
    set((state) => ({ selectedSpell2Draft: resolveStateUpdater(value, state.selectedSpell2Draft) }))
  },
  setSelectedSkinDraft(value) {
    set((state) => ({ selectedSkinDraft: resolveStateUpdater(value, state.selectedSkinDraft) }))
  },
  setRunePageNameDraft(value) {
    set((state) => ({ runePageNameDraft: resolveStateUpdater(value, state.runePageNameDraft) }))
  },
  setInstallPromptAvailable(value) {
    set((state) => ({ installPromptAvailable: resolveStateUpdater(value, state.installPromptAvailable) }))
  },
  setIsStandaloneMode(value) {
    set((state) => ({ isStandaloneMode: resolveStateUpdater(value, state.isStandaloneMode) }))
  },
  resetConnectedUiState() {
    set(initialConnectedUiState)
  },
}))
