import { RiftClientState } from '@core/rift/rift-client-types'

import type { LobbyMemberSnapshot } from '../../-lobby-types'
import type { UseLobbySocialActionsOptions } from './lobby-social-actions-types'

export function useLobbySocialActions(options: UseLobbySocialActionsOptions) {
  const {
    status,
    lcuClient,
    appendLog,
    lobbyActionPending,
    setLobbyActionPending,
    selectedQueueId,
    queueDodgePenaltySeconds,
    memberActionPendingById,
    setMemberActionPendingById,
    inviteSubmissionPending,
    setInviteSubmissionPending,
    inviteName,
    setInviteName,
    roleUpdatePending,
    setRoleUpdatePending,
    firstRoleDraft,
    secondRoleDraft,
    localLobbyMember,
    unknownSummonerLabel,
    leaveLobbyConfirmMessage,
    buildPromoteConfirmMessage,
    buildKickConfirmMessage,
    confirm,
  } = options

  async function sendLobbyAction(action: () => Promise<unknown>, label: string) {
    if (status !== RiftClientState.CONNECTED || lobbyActionPending) {
      return
    }

    setLobbyActionPending(true)
    try {
      await action()
    } catch (error) {
      appendLog(`lobby action failed (${label}): ${String(error)}`)
    } finally {
      setLobbyActionPending(false)
    }
  }

  async function leaveQueue() {
    await sendLobbyAction(() => lcuClient.lobby.leaveQueue(), 'leave queue')
  }

  async function leaveLobby() {
    if (!confirm(leaveLobbyConfirmMessage)) {
      return
    }

    await sendLobbyAction(() => lcuClient.lobby.deleteLobby(), 'leave lobby')
  }

  async function joinQueue() {
    if (queueDodgePenaltySeconds >= 0) {
      return
    }

    await sendLobbyAction(() => lcuClient.lobby.joinQueue(), 'join queue')
  }

  async function createLobby() {
    const queueId = Number(selectedQueueId)
    if (!Number.isFinite(queueId) || queueId <= 0) {
      return
    }

    await sendLobbyAction(() => lcuClient.lobby.createLobby({ queueId }), 'create lobby')
  }

  function setMemberActionPending(summonerId: number, pending: boolean) {
    setMemberActionPendingById((previous) => {
      return {
        ...previous,
        [summonerId]: pending,
      }
    })
  }

  async function sendMemberAction(summonerId: number, action: () => Promise<unknown>, label: string, confirmPrompt?: string) {
    if (status !== RiftClientState.CONNECTED || memberActionPendingById[summonerId]) {
      return
    }

    if (confirmPrompt && !confirm(confirmPrompt)) {
      return
    }

    setMemberActionPending(summonerId, true)
    try {
      await action()
    } catch (error) {
      appendLog(`member action failed (${label}): ${String(error)}`)
    } finally {
      setMemberActionPending(summonerId, false)
    }
  }

  async function promoteMember(member: LobbyMemberSnapshot) {
    const displayName = member.displayName ?? unknownSummonerLabel
    await sendMemberAction(
      member.summonerId,
      () => lcuClient.lobby.promoteMember(member.summonerId),
      'promote',
      buildPromoteConfirmMessage(displayName),
    )
  }

  async function kickMember(member: LobbyMemberSnapshot) {
    const displayName = member.displayName ?? unknownSummonerLabel
    await sendMemberAction(member.summonerId, () => lcuClient.lobby.kickMember(member.summonerId), 'kick', buildKickConfirmMessage(displayName))
  }

  async function toggleMemberInvite(member: LobbyMemberSnapshot) {
    if (member.allowedInviteOthers) {
      await sendMemberAction(member.summonerId, () => lcuClient.lobby.revokeMemberInvite(member.summonerId), 'revoke invite')
      return
    }

    await sendMemberAction(member.summonerId, () => lcuClient.lobby.grantMemberInvite(member.summonerId), 'grant invite')
  }

  async function inviteSummoner(toSummonerId: number) {
    if (status !== RiftClientState.CONNECTED || inviteSubmissionPending) {
      return
    }

    setInviteSubmissionPending(true)
    try {
      await lcuClient.lobby.inviteSummoners([{ toSummonerId }])
      setInviteName('')
    } catch (error) {
      appendLog(`invite submission failed: ${String(error)}`)
    } finally {
      setInviteSubmissionPending(false)
    }
  }

  async function inviteByName() {
    const normalized = inviteName.trim()
    if (!normalized || status !== RiftClientState.CONNECTED || inviteSubmissionPending) {
      return
    }

    setInviteSubmissionPending(true)
    try {
      const response = await lcuClient.summoner.getSummonerByName(normalized)
      if (response.status !== 200 || typeof (response.content as { summonerId?: unknown }).summonerId !== 'number') {
        appendLog(`invite lookup failed for ${normalized}`)
        return
      }

      const summonerId = (response.content as { summonerId: number }).summonerId
      await lcuClient.lobby.inviteSummoners([{ toSummonerId: summonerId }])
      setInviteName('')
    } catch (error) {
      appendLog(`invite lookup failed: ${String(error)}`)
    } finally {
      setInviteSubmissionPending(false)
    }
  }

  async function updateRoles() {
    if (status !== RiftClientState.CONNECTED || roleUpdatePending || !localLobbyMember) {
      return
    }

    setRoleUpdatePending(true)
    try {
      await lcuClient.lobby.updateLocalMemberPositionPreferences({
        firstPreference: firstRoleDraft,
        secondPreference: secondRoleDraft,
      })
    } catch (error) {
      appendLog(`role update failed: ${String(error)}`)
    } finally {
      setRoleUpdatePending(false)
    }
  }

  return {
    leaveQueue,
    leaveLobby,
    joinQueue,
    createLobby,
    promoteMember,
    kickMember,
    toggleMemberInvite,
    inviteSummoner,
    inviteByName,
    updateRoles,
  }
}
