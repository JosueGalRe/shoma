import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'

import { Button, Input } from '@/components/ui'
import { createLcuQueryOptions, suggestedPlayersDescriptor } from '@/core/lcu/lcu-queries'
import { useLCUTransport } from '@/core/rift/hooks'
import { useSharedRiftClient } from '@/core/rift/rift-client-provider'
import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray } from '@/core/lcu/parsers/base'

export type InviteOverlayProps = {
  canInvite: boolean
  isActionPending: boolean
  isConnected: boolean
  onClose: () => void
  onInvite: (summonerName: string) => Promise<void>
}

const SuggestedPlayerSchema = v.object({
  summonerId: finiteNumber,
  summonerName: v.pipe(v.string(), v.nonEmpty()),
})

type SuggestedPlayer = v.InferOutput<typeof SuggestedPlayerSchema>

function parseSuggestedPlayers(content: unknown): SuggestedPlayer[] {
  return (parseOrNull(unknownArray, content) ?? []).flatMap((entry) => {
    const player = parseObjectOrNull(SuggestedPlayerSchema, entry)
    return player ? [player] : []
  })
}

export function InviteOverlay({ canInvite, isActionPending, isConnected, onClose, onInvite }: InviteOverlayProps) {
  const { t } = useTranslation()
  const [inviteName, setInviteName] = useState('')
  const { client } = useSharedRiftClient()
  const transport = useLCUTransport(client)

  const suggestedPlayersQuery = useQuery({
    ...createLcuQueryOptions(suggestedPlayersDescriptor, transport),
    select: parseSuggestedPlayers,
  })

  const suggestedPlayers = suggestedPlayersQuery.data ?? []

  async function submitInvite(event: React.FormEvent) {
    event.preventDefault()
    if (!inviteName.trim()) return

    await onInvite(inviteName)
    setInviteName('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-lol-navy-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-lol-border-subtle bg-lol-navy-950 p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-lol-text-primary">{t('lobby.inviteOverlay.title')}</h2>
          <button
            aria-label="Close invite overlay"
            className="rounded-full p-2 text-lol-text-muted hover:bg-lol-navy-800 hover:text-lol-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold"
            onClick={onClose}
            type="button"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form className="mb-6 flex gap-2" onSubmit={submitInvite}>
          <Input
            aria-label={t('lobby.summonerName')}
            disabled={!isConnected || isActionPending || !canInvite}
            onChange={(event) => setInviteName(event.target.value)}
            placeholder={t('lobby.summonerName')}
            value={inviteName}
          />
          <Button disabled={!isConnected || isActionPending || !canInvite || !inviteName.trim()} type="submit" variant="primary">
            {t('lobby.inviteOverlay.open')}
          </Button>
        </form>

        {!canInvite ? (
          <p className="mb-4 text-sm text-yellow-500">{t('lobby.invitePermission')}</p>
        ) : null}

        {suggestedPlayers.length > 0 ? (
          <div>
            <h3 className="mb-3 text-sm font-medium text-lol-text-muted">{t('lobby.suggestedPlayers')}</h3>
            <ul className="max-h-60 space-y-2 overflow-y-auto pr-2">
              {suggestedPlayers.map((player) => (
                <li key={player.summonerId} className="flex items-center justify-between rounded-md border border-lol-border-subtle p-3">
                  <span className="text-sm font-medium text-lol-text-primary">{player.summonerName}</span>
                  <Button
                    disabled={!isConnected || isActionPending || !canInvite}
                    onClick={async () => {
                      await onInvite(player.summonerName)
                      onClose()
                    }}
                    size="sm"
                    variant="secondary"
                  >
                    {t('common.invite')}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  )
}
