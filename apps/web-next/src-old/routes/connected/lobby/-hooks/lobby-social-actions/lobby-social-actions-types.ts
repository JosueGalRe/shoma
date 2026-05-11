import type { LcuClient } from '@core/rift/lcu-client'
import type { RiftClientState } from '@core/rift/rift-client-types'

import type { LobbyMemberSnapshot } from '../../-lobby-types'

export type UseLobbySocialActionsOptions = {
  status: RiftClientState | null
  lcuClient: LcuClient
  appendLog: (message: string) => void
  lobbyActionPending: boolean
  setLobbyActionPending: (value: boolean) => void
  selectedQueueId: string
  queueDodgePenaltySeconds: number
  memberActionPendingById: Record<number, boolean>
  setMemberActionPendingById: (value: (previous: Record<number, boolean>) => Record<number, boolean>) => void
  inviteSubmissionPending: boolean
  setInviteSubmissionPending: (value: boolean) => void
  inviteName: string
  setInviteName: (value: string) => void
  roleUpdatePending: boolean
  setRoleUpdatePending: (value: boolean) => void
  firstRoleDraft: string
  secondRoleDraft: string
  localLobbyMember: LobbyMemberSnapshot | null
  unknownSummonerLabel: string
  leaveLobbyConfirmMessage: string
  buildPromoteConfirmMessage: (displayName: string) => string
  buildKickConfirmMessage: (displayName: string) => string
  confirm: (message: string) => boolean
}
