import { Link, createFileRoute } from '@tanstack/react-router'
import { Trans, useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { RiftClientState } from '../core/rift/rift-client-types'
import { formatSeconds } from '../core/rift/rift-lcu-utils'
import { useRiftStore } from '../core/rift/rift-store'
import { LanguageSwitcher } from '../features/i18n/language-switcher'

export const Route = createFileRoute('/connected')({
  component: ConnectedRoute,
})

function ConnectedRoute() {
  const { t } = useTranslation()
  const { status, peerName, peerVersion, queueState, lobbyDetails, logLines } = useRiftStore()

  if (status !== RiftClientState.CONNECTED) {
    return (
      <main className='mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-5 py-10 sm:px-8'>
        <Card className='rounded-3xl border-white/60 bg-white/75 p-6 shadow-2xl backdrop-blur sm:p-10'>
          <h1 className='font-display text-ink text-3xl'>{t(($) => $.connected.unavailableTitle)}</h1>
          <p className='mt-3 text-slate-700'>{t(($) => $.connected.unavailableBody)}</p>
          <Button asChild className='bg-ink font-display text-mist hover:bg-slate mt-6 h-12 rounded-2xl px-5'>
            <Link to='/'>{t(($) => $.connected.backToConnect)}</Link>
          </Button>
        </Card>
      </main>
    )
  }

  return (
    <main className='mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-5 py-10 sm:px-8'>
      <Card className='rounded-3xl border-white/60 bg-white/75 p-6 shadow-2xl backdrop-blur sm:p-10'>
        <div className='flex items-center justify-between gap-3'>
          <h1 className='font-display text-ink text-4xl leading-tight'>{t(($) => $.connected.title)}</h1>
          <div className='flex items-center gap-2'>
            <LanguageSwitcher />
            <Button asChild variant='outline' className='font-display h-11 rounded-2xl border-slate-300 px-4 text-slate-700'>
              <Link to='/'>{t(($) => $.connected.back)}</Link>
            </Button>
          </div>
        </div>

        <div className='mt-8 grid gap-4 sm:grid-cols-2'>
          <Card className='rounded-2xl border-slate-200 bg-white p-4'>
            <h3 className='font-display text-slate text-sm tracking-[0.2em] uppercase'>{t(($) => $.connected.desktop)}</h3>
            <p className='mt-2 text-slate-700'>{peerName ?? t(($) => $.connected.unknownMachine)}</p>
            <p className='text-sm text-slate-500'>
              <Trans
                components={{ value: <span className='font-semibold' /> }}
                i18nKey={($) => $.connected.versionValue}
                values={{ value: peerVersion ?? t(($) => $.connected.pending) }}
              />
            </p>
          </Card>

          <Card className='rounded-2xl border-slate-200 bg-white p-4'>
            <h3 className='font-display text-slate text-sm tracking-[0.2em] uppercase'>{t(($) => $.connected.queue)}</h3>
            {queueState ? (
              <div className='mt-2 space-y-2 text-slate-700'>
                <p>
                  <Trans
                    components={{ value: <span className='font-semibold' /> }}
                    i18nKey={($) => $.connected.stateValue}
                    values={{ value: queueState.searchState ?? t(($) => $.connected.searching) }}
                  />
                </p>
                <p>
                  <Trans
                    components={{ value: <span className='font-semibold' /> }}
                    i18nKey={($) => $.connected.elapsedValue}
                    values={{ value: formatSeconds(queueState.timeInQueue ?? 0) }}
                  />
                </p>
                <p>
                  <Trans
                    components={{ value: <span className='font-semibold' /> }}
                    i18nKey={($) => $.connected.estimatedValue}
                    values={{ value: formatSeconds(queueState.estimatedQueueTime ?? 0) }}
                  />
                </p>
              </div>
            ) : (
              <p className='mt-2 text-slate-600'>{t(($) => $.connected.notInQueue)}</p>
            )}
          </Card>

          <Card className='rounded-2xl border-slate-200 bg-white p-4 sm:col-span-2'>
            <h3 className='font-display text-slate text-sm tracking-[0.2em] uppercase'>{t(($) => $.connected.lobby)}</h3>
            {lobbyDetails ? (
              <div className='mt-2 grid gap-2 text-slate-700 sm:grid-cols-2'>
                <p>
                  <Trans
                    components={{ value: <span className='font-semibold' /> }}
                    i18nKey={($) => $.connected.membersValue}
                    values={{ value: lobbyDetails.memberCount }}
                  />
                </p>
                <p>
                  <Trans
                    components={{ value: <span className='font-semibold' /> }}
                    i18nKey={($) => $.connected.invitesValue}
                    values={{ value: lobbyDetails.inviteCount }}
                  />
                </p>
                <p>
                  <Trans
                    components={{ value: <span className='font-semibold' /> }}
                    i18nKey={($) => $.connected.queueLabelValue}
                    values={{
                      value: lobbyDetails.queueName ?? lobbyDetails.queueId ?? t(($) => $.connected.unknown),
                    }}
                  />
                </p>
                <p>
                  <Trans
                    components={{ value: <span className='font-semibold' /> }}
                    i18nKey={($) => $.connected.mapValue}
                    values={{
                      value: lobbyDetails.mapName ?? lobbyDetails.mapId ?? t(($) => $.connected.unknown),
                    }}
                  />
                </p>
              </div>
            ) : (
              <p className='mt-2 text-slate-600'>{t(($) => $.connected.noLobbySnapshot)}</p>
            )}
          </Card>
        </div>

        {logLines.length > 0 ? (
          <Card className='mt-8 rounded-2xl border-slate-200 bg-white p-4'>
            <h3 className='font-display text-slate text-sm tracking-[0.2em] uppercase'>{t(($) => $.connected.relayPreview)}</h3>
            <ul className='mt-3 space-y-2 text-sm text-slate-700'>
              {logLines.map((line) => (
                <li className='rounded-lg bg-slate-50 px-3 py-2' key={line}>
                  {line}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </Card>
    </main>
  )
}
