import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import type { SuggestedPlayer } from '../-lobby-types'

interface InvitePanelProps {
  canInviteOthers: boolean
  showInvitePanel: boolean
  setShowInvitePanel: (updater: (previous: boolean) => boolean) => void
  inviteName: string
  setInviteName: (name: string) => void
  inviteSubmissionPending: boolean
  inviteByName: () => Promise<void>
  suggestedPlayers: SuggestedPlayer[]
  inviteSummoner: (summonerId: number) => Promise<void>
}

export function InvitePanel({
  canInviteOthers,
  showInvitePanel,
  setShowInvitePanel,
  inviteName,
  setInviteName,
  inviteSubmissionPending,
  inviteByName,
  suggestedPlayers,
  inviteSummoner,
}: InvitePanelProps) {
  const { t } = useTranslation()

  if (!canInviteOthers) {
    return null
  }

  return (
    <div className='rounded-xl border border-gold-dim/30 bg-background/40 p-4 sm:col-span-2'>
      <div className='flex items-center justify-between'>
        <p className='font-display text-sm uppercase tracking-[0.1em] text-primary'>
          {t(($) => $.connected.lobbyInvitesPanel)}
        </p>
        <Button
          variant='outline'
          size='sm'
          className='font-display tracking-wider uppercase'
          onClick={() => {
            setShowInvitePanel((previous) => !previous)
          }}
          type='button'
        >
          {showInvitePanel ? t(($) => $.connected.invitePanelClose) : t(($) => $.connected.invitePanelOpen)}
        </Button>
      </div>

      {showInvitePanel ? (
        <div className='mt-4 space-y-4'>
          <div className='flex gap-3'>
            <input
              className='h-9 flex-1 rounded-md border border-gold-dim/50 bg-background/60 px-3 text-sm text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/50'
              aria-label='Summoner name to invite'
              onChange={(event) => {
                setInviteName(event.target.value)
              }}
              placeholder={t(($) => $.connected.inviteByNamePlaceholder)}
              value={inviteName}
            />
            <Button
              variant='default'
              className='font-display tracking-wider uppercase'
              disabled={inviteSubmissionPending || inviteName.trim().length === 0}
              onClick={() => {
                void inviteByName()
              }}
              type='button'
            >
              {t(($) => $.connected.inviteByNameAction)}
            </Button>
          </div>

          {suggestedPlayers.length > 0 ? (
            <ul className='space-y-2'>
              {suggestedPlayers.map((suggestion: SuggestedPlayer) => (
                <li
                  className='flex items-center justify-between rounded-lg border border-gold-dim/20 bg-card/50 px-4 py-2'
                  key={suggestion.summonerId}
                >
                  <span className='text-sm font-semibold text-foreground'>{suggestion.summonerName}</span>
                  <Button
                    variant='hextech'
                    size='sm'
                    className='font-display tracking-wider uppercase'
                    disabled={inviteSubmissionPending}
                    onClick={() => {
                      void inviteSummoner(suggestion.summonerId)
                    }}
                    type='button'
                  >
                    {t(($) => $.connected.inviteSuggestedAction)}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className='text-sm text-muted-foreground italic'>{t(($) => $.connected.inviteNoSuggestions)}</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
