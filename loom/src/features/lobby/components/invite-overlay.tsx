import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as v from 'valibot'

import { Button, Input } from '@/components/ui'
import { createLcuQueryOptions, suggestedPlayersDescriptor } from '@/core/lcu/lcu-queries'
import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray } from '@/core/lcu/parsers/base'
import { useSharedLCUTransport } from '@/core/relay/relay-client-provider'

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
  const transport = useSharedLCUTransport()

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
    <div className='bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm'>
      <div className='border-border bg-background w-full max-w-md rounded-lg border p-6 shadow-xl'>
        <div className='mb-6 flex items-center justify-between'>
          <h2 className='text-foreground text-xl font-semibold'>{t('lobby.inviteOverlay.title')}</h2>
          <button
            aria-label='Close invite overlay'
            className='text-muted hover:bg-secondary hover:text-foreground focus-visible:ring-ring rounded-full p-2 focus-visible:ring-2 focus-visible:outline-none'
            onClick={onClose}
            type='button'
          >
            <svg className='size-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>

        <form className='mb-6 flex gap-2' onSubmit={submitInvite}>
          <Input
            aria-label={t('lobby.summonerName')}
            disabled={!isConnected || isActionPending || !canInvite}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setInviteName(event.target.value)}
            placeholder={t('lobby.summonerName')}
            value={inviteName}
          />
          <Button
            disabled={!isConnected || isActionPending || !canInvite || !inviteName.trim()}
            type='submit'
            variant='primary'
          >
            {t('lobby.inviteOverlay.open')}
          </Button>
        </form>

        {!canInvite ? <p className='text-accent mb-4 text-sm'>{t('lobby.invitePermission')}</p> : null}

        {suggestedPlayers.length > 0 ? (
          <div>
            <h3 className='text-muted mb-3 text-sm font-medium'>{t('lobby.suggestedPlayers')}</h3>
            <ul className='max-h-60 space-y-2 overflow-y-auto pr-2'>
              {suggestedPlayers.map((player) => (
                <li key={player.summonerId} className='border-border flex items-center justify-between rounded-md border p-3'>
                  <span className='text-foreground text-sm font-medium'>{player.summonerName}</span>
                  <Button
                    disabled={!isConnected || isActionPending || !canInvite}
                    onClick={async () => {
                      await onInvite(player.summonerName)
                      onClose()
                    }}
                    size='sm'
                    variant='secondary'
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
