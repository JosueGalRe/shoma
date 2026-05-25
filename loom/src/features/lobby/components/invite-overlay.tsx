import { type ChangeEvent, type FormEvent, useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { Button, Input } from '@/components/ui'
import { createLcuQueryOptions, suggestedPlayersDescriptor } from '@/core/lcu/lcu-queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'

import { inviteOverlayStyles } from './invite-overlay-styles'
import { parseSuggestedPlayers } from './invite-overlay-utils'

import type { InviteOverlayProps } from './invite-overlay-types'

export function InviteOverlay({ canInvite, isActionPending, isConnected, onClose, onInvite }: InviteOverlayProps) {
  const { t } = useTranslation()
  const [inviteName, setInviteName] = useState('')
  const transport = useSharedLCUTransport()
  const styles = inviteOverlayStyles()

  const suggestedPlayersQuery = useQuery({
    ...createLcuQueryOptions(suggestedPlayersDescriptor, transport),
    select: parseSuggestedPlayers,
  })

  const suggestedPlayers = suggestedPlayersQuery.data ?? []

  async function submitInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!inviteName.trim()) {
      return
    }

    await onInvite(inviteName)
    setInviteName('')
    onClose()
  }

  return (
    <div className={styles.overlay()}>
      <div className={styles.panel()}>
        <div className={styles.header()}>
          <h2 className={styles.title()}>{t('lobby.inviteOverlay.title')}</h2>

          <button aria-label='Close invite overlay' className={styles.closeButton()} onClick={onClose} type='button'>
            <svg className={styles.closeIcon()} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>

        <form className={styles.form()} onSubmit={submitInvite}>
          <Input
            aria-label={t('lobby.summonerName')}
            disabled={!isConnected || isActionPending || !canInvite}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setInviteName(event.target.value)
            }}
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

        {!canInvite ? <p className={styles.permission()}>{t('lobby.invitePermission')}</p> : null}

        {suggestedPlayers.length > 0 ? (
          <div>
            <h3 className={styles.sectionTitle()}>{t('lobby.suggestedPlayers')}</h3>

            <ul className={styles.list()}>
              {suggestedPlayers.map((player) => {
                return (
                  <li key={player.summonerId} className={styles.suggestionItem()}>
                    <span className={styles.suggestionName()}>{player.summonerName}</span>

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
                )
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  )
}
