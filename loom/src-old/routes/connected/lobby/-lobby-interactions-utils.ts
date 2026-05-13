import type { LcuClient } from '@core/rift/lcu-client'

type SetReadyCheckPending = (value: boolean) => void

type SetInviteActionPendingById = (value: (previous: Record<string, boolean>) => Record<string, boolean>) => void

type ConnectedLogger = (message: string) => void

type ReadyCheckActionArgs = {
  isConnected: boolean
  readyCheckPending: boolean
  action: () => Promise<unknown>
  logMessage: string
  setReadyCheckPending: SetReadyCheckPending
  appendLog: ConnectedLogger
}

type InviteResponseArgs = {
  invitationId: string
  action: 'accept' | 'decline'
  isConnected: boolean
  inviteActionPendingById: Record<string, boolean>
  lcuClient: LcuClient
  setInviteActionPendingById: SetInviteActionPendingById
  appendLog: ConnectedLogger
}

export async function sendReadyCheckResponse(args: ReadyCheckActionArgs): Promise<void> {
  const { isConnected, readyCheckPending, action, logMessage, setReadyCheckPending, appendLog } = args
  if (!isConnected || readyCheckPending) {
    return
  }

  setReadyCheckPending(true)
  try {
    await action()
  } catch (error) {
    appendLog(`${logMessage}: ${String(error)}`)
  } finally {
    setReadyCheckPending(false)
  }
}

export async function sendInviteResponse(args: InviteResponseArgs): Promise<void> {
  const {
    invitationId,
    action,
    isConnected,
    inviteActionPendingById,
    lcuClient,
    setInviteActionPendingById,
    appendLog,
  } = args

  if (!isConnected || inviteActionPendingById[invitationId]) {
    return
  }

  setInviteActionPendingById((previous) => {
    return {
      ...previous,
      [invitationId]: true,
    }
  })

  try {
    if (action === 'accept') {
      await lcuClient.lobby.acceptReceivedInvitation(invitationId)
    } else {
      await lcuClient.lobby.declineReceivedInvitation(invitationId)
    }
  } catch (error) {
    appendLog(`invite ${action} failed (${invitationId}): ${String(error)}`)
  } finally {
    setInviteActionPendingById((previous) => {
      return {
        ...previous,
        [invitationId]: false,
      }
    })
  }
}
