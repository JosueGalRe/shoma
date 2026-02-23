import { create } from 'zustand'

import type { RiftClient } from './rift-client'
import { RiftClientState, type RiftClientState as RiftClientStateValue } from './rift-client-types'
import type { LobbyDetails, QueueState } from './rift-lcu-types'

type RiftStoreState = {
  code: string
  status: RiftClientStateValue | null
  client: RiftClient | null
  peerVersion: string | null
  peerName: string | null
  queueState: QueueState | null
  lobbyDetails: LobbyDetails | null
  logLines: string[]
  errorBanner: string | null
}

type RiftStoreActions = {
  setCode: (code: string) => void
  setStatus: (status: RiftClientStateValue | null) => void
  setClient: (client: RiftClient | null) => void
  setPeer: (version: string | null, name: string | null) => void
  setQueueState: (state: QueueState | null) => void
  setLobbyDetails: (details: LobbyDetails | null) => void
  appendLog: (line: string) => void
  setErrorBanner: (error: string | null) => void
  resetLcuSession: () => void
  resetAll: () => void
}

const initialState: RiftStoreState = {
  code: '',
  status: null,
  client: null,
  peerVersion: null,
  peerName: null,
  queueState: null,
  lobbyDetails: null,
  logLines: [],
  errorBanner: null,
}

export const useRiftStore = create<RiftStoreState & RiftStoreActions>()((set) => ({
  ...initialState,
  setCode(code) {
    set({ code })
  },
  setStatus(status) {
    set({ status })
  },
  setClient(client) {
    set({ client })
  },
  setPeer(version, name) {
    set({ peerVersion: version, peerName: name })
  },
  setQueueState(state) {
    set({ queueState: state })
  },
  setLobbyDetails(details) {
    set({ lobbyDetails: details })
  },
  appendLog(line) {
    set((state) => ({
      logLines: [line, ...state.logLines].slice(0, 12),
    }))
  },
  setErrorBanner(error) {
    set({ errorBanner: error })
  },
  resetLcuSession() {
    set({
      peerVersion: null,
      peerName: null,
      queueState: null,
      lobbyDetails: null,
      logLines: [],
      errorBanner: null,
    })
  },
  resetAll() {
    set({
      ...initialState,
      status: RiftClientState.DISCONNECTED,
    })
  },
}))
