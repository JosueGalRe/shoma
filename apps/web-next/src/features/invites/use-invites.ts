import { LcuHttpMethod, LcuPaths } from '@mimic/protocol-contract'
import { useCallback, useEffect, useMemo } from 'react'

import { useLCUObserver, useLCUTransport, useRiftClient } from '@/core/rift'
import { useRiftStore } from '@/core/state/rift-store'
import { notify } from '@/features/notifications/notification-manager'

import { type Invite, useInvitesStore } from './invites-store'

type LcuInviteRecord = Record<string, unknown>

type UseInvitesResult = {
  acceptInvite: (id: string) => Promise<boolean>
  declineInvite: (id: string) => Promise<boolean>
  error: Error | null
  invites: Invite[]
  isLoading: boolean
}

function isRecord(value: unknown): value is LcuInviteRecord {
  return typeof value === 'object' && value !== null
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function readGameMode(record: LcuInviteRecord): string {
  const directMode = readString(record.gameMode)
  if (directMode) {
    return directMode
  }

  const nestedConfig = isRecord(record.gameConfig) ? record.gameConfig : null
  const nestedMode = nestedConfig ? readString(nestedConfig.gameMode) : null
  if (nestedMode) {
    return nestedMode
  }

  const queueId = nestedConfig?.queueId ?? record.queueId
  if (typeof queueId === 'number') {
    return `Queue ${queueId}`
  }

  const mapId = nestedConfig?.mapId ?? record.mapId
  if (typeof mapId === 'number') {
    return `Map ${mapId}`
  }

  return 'Unknown mode'
}

function readInviterName(record: LcuInviteRecord): string {
  return (
    readString(record.inviterName)
    ?? readString(record.fromSummonerName)
    ?? readString(record.fromDisplayName)
    ?? readString(record.fromName)
    ?? 'Unknown player'
  )
}

function readInviteId(record: LcuInviteRecord): string | null {
  return readString(record.id) ?? readString(record.invitationId) ?? readString(record.inviteId)
}

function toInvite(value: unknown): Invite | null {
  if (!isRecord(value)) {
    return null
  }

  const id = readInviteId(value)
  if (!id) {
    return null
  }

  return {
    gameMode: readGameMode(value),
    id,
    inviterName: readInviterName(value),
  }
}

function normalizeInvites(values: readonly unknown[]): Invite[] {
  return values.map(toInvite).filter((invite): invite is Invite => invite !== null)
}

function assertSuccessfulInviteResponse(path: string, status: number): void {
  if (status < 200 || status >= 300) {
    throw new Error(`LCU request failed (${status}): ${path}`)
  }
}

export function useInvites(): UseInvitesResult {
  const code = useRiftStore((state) => state.code)
  const clientOptions = useMemo(() => ({ code, enabled: code.length > 0 }), [code])
  const { client } = useRiftClient(clientOptions)
  const transport = useLCUTransport(client)

  const observedInvites = useLCUObserver<unknown[]>(transport, LcuPaths.lobby.receivedInvitations)
  const invites = useInvitesStore((state) => state.invites)
  const addInvite = useInvitesStore((state) => state.addInvite)
  const acceptInviteInStore = useInvitesStore((state) => state.acceptInvite)
  const declineInviteInStore = useInvitesStore((state) => state.declineInvite)
  const removeInvite = useInvitesStore((state) => state.removeInvite)

  useEffect(() => {
    const nextInvites = normalizeInvites(observedInvites.data?.content ?? [])
    const nextIds = new Set(nextInvites.map((invite) => invite.id))
    const currentIds = new Set(invites.map((invite) => invite.id))

    nextInvites.forEach((invite) => {
      if (!currentIds.has(invite.id)) {
        notify('invite-received', { inviterName: invite.inviterName })
      }

      addInvite(invite)
    })

    invites.forEach((invite) => {
      if (!nextIds.has(invite.id)) {
        removeInvite(invite.id)
      }
    })
  }, [addInvite, invites, observedInvites.data, removeInvite])

  const acceptInvite = useCallback(
    async (id: string) => {
      if (!transport) {
        return false
      }

      const path = LcuPaths.lobby.receivedInvitationAccept(id)
      const result = await transport.request(path, LcuHttpMethod.POST)
      assertSuccessfulInviteResponse(path, result.status)
      acceptInviteInStore(id)
      return true
    },
    [acceptInviteInStore, transport],
  )

  const declineInvite = useCallback(
    async (id: string) => {
      if (!transport) {
        return false
      }

      const path = LcuPaths.lobby.receivedInvitationDecline(id)
      const result = await transport.request(path, LcuHttpMethod.POST)
      assertSuccessfulInviteResponse(path, result.status)
      declineInviteInStore(id)
      return true
    },
    [declineInviteInStore, transport],
  )

  return {
    acceptInvite,
    declineInvite,
    error: observedInvites.error,
    invites,
    isLoading: observedInvites.isLoading,
  }
}
