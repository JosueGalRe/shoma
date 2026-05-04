import { Mail, Timer, Check, X } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useInvites } from '../use-invites'
import type { LobbyInvite } from '../invites-store'

function readInviteTitle(invite: LobbyInvite): string {
  return `Invite from summoner ${invite.fromSummonerId}`
}

function readExpirationLabel(invite: LobbyInvite): string {
  const rawExpiration = invite.expiresAt ?? invite.expirationTimestamp
  if (!rawExpiration) {
    return 'Expires when withdrawn'
  }

  const expiration = typeof rawExpiration === 'number' ? rawExpiration : Date.parse(rawExpiration)
  if (Number.isNaN(expiration)) {
    return 'Expiration unavailable'
  }

  const secondsRemaining = Math.max(0, Math.ceil((expiration - Date.now()) / 1000))
  return secondsRemaining === 0 ? 'Expiring now' : `Expires in ${secondsRemaining}s`
}

function readInviteDetails(invite: LobbyInvite): string {
  const queueId = invite.gameConfig?.queueId
  const mapId = invite.gameConfig?.mapId

  if (queueId && mapId) {
    return `Queue ${queueId} · Map ${mapId}`
  }

  if (queueId) {
    return `Queue ${queueId}`
  }

  if (mapId) {
    return `Map ${mapId}`
  }

  return 'Lobby invitation'
}

export function InvitesToast() {
  const { acceptInvite, declineInvite, error, invites, isLoading } = useInvites()

  return (
    <main className='relative z-10 mx-auto flex flex-col w-full max-w-3xl gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300'>
      {invites.length > 0 ? (
        <Alert className='border-primary/40 bg-primary/10 text-primary shadow-[0_0_15px_rgba(10,200,185,0.15)]'>
          <Mail className='h-5 w-5' />
          <AlertTitle className='font-display tracking-widest uppercase'>Lobby invitation received</AlertTitle>
          <AlertDescription className='text-primary/80'>
            {invites.length === 1 ? 'Respond before the invitation expires.' : `${invites.length} pending invitations are waiting.`}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className='border-gold-dim/30 bg-card/80 backdrop-blur-md shadow-xl'>
        <CardHeader className='border-b border-gold-dim/20 pb-4'>
          <CardTitle className='font-display text-sm tracking-[0.25em] text-primary uppercase flex items-center gap-2'>
            <Mail className='h-4 w-4' />
            Pending Invites
          </CardTitle>
        </CardHeader>
        <CardContent className='pt-6 space-y-4'>
          {error ? (
            <div className='rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive animate-shake'>
              {error.message}
            </div>
          ) : null}

          {invites.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-center space-y-4'>
              <div className='w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center'>
                <Mail className='h-8 w-8 text-muted-foreground/50' />
              </div>
              <p className='text-muted-foreground font-display tracking-widest uppercase'>
                {isLoading ? 'Loading invitations...' : 'No pending invitations'}
              </p>
            </div>
          ) : (
            <ul className='space-y-4'>
              {invites.map((invite) => (
                <li key={invite.invitationId} className='group rounded-2xl border border-gold-dim/30 bg-background/60 p-5 transition-all hover:border-primary/50 hover:shadow-[0_0_20px_rgba(10,200,185,0.1)]'>
                  <div className='flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between'>
                    <div className='space-y-2'>
                      <p className='font-display text-xl text-foreground font-semibold tracking-wide'>{readInviteTitle(invite)}</p>
                      <p className='text-sm text-muted-foreground'>{readInviteDetails(invite)}</p>
                      <div className='inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-widest text-primary uppercase'>
                        <Timer className='h-3.5 w-3.5' />
                        {readExpirationLabel(invite)}
                      </div>
                    </div>

                    <div className='flex gap-3 sm:w-auto w-full'>
                      <Button
                        className='flex-1 sm:flex-none h-12 px-6 font-display tracking-widest uppercase bg-gradient-to-r from-primary to-teal-dim hover:from-teal hover:to-primary rounded-xl'
                        disabled={isLoading}
                        onClick={() => {
                          void acceptInvite(invite.invitationId)
                        }}
                        type='button'
                      >
                        <Check className='mr-2 h-4 w-4' />
                        Accept
                      </Button>
                      <Button
                        className='flex-1 sm:flex-none h-12 px-6 font-display tracking-widest uppercase border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl'
                        disabled={isLoading}
                        onClick={() => {
                          void declineInvite(invite.invitationId)
                        }}
                        type='button'
                        variant='outline'
                      >
                        <X className='mr-2 h-4 w-4' />
                        Decline
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
