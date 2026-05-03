import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2 } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { RiftClientState, type RiftClientState as RiftClientStateValue } from '../../../core/rift/rift-client-types'
import { LanguageSwitcher } from '../../i18n/language-switcher'

type ConnectScreenShellProps = {
  status: RiftClientStateValue | null
  errorBanner: string | null
  children: ReactNode
}

export function ConnectScreenShell({ status, errorBanner, children }: ConnectScreenShellProps) {
  const { t } = useTranslation()

  return (
    <main className='relative mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-5 py-10 sm:px-8'>
      {/* Background glow */}
      <div className='pointer-events-none fixed inset-0 z-0'>
        <div className='absolute inset-0 bg-gradient-to-b from-background via-card to-background' />
        <div className='absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl' />
        <div className='absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-accent/5 blur-3xl' />
      </div>

      <section className='relative z-10 rounded-3xl border border-gold-dim/40 bg-card/80 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-10'>
        {/* Top gold line */}
        <div className='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent' />

        <div className='flex items-start justify-between gap-4'>
          <p className='font-display text-xs tracking-[0.3em] text-gold-dim uppercase'>{t(($) => $.connect.brand)}</p>
          <LanguageSwitcher />
        </div>
        <h1 className='font-display mt-4 text-4xl leading-tight text-foreground sm:text-5xl'>
          {t(($) => $.connect.heading)}
        </h1>
        <p className='mt-4 text-base text-muted-foreground'>{t(($) => $.connect.subtitle)}</p>

        {errorBanner ? (
          <Alert
            className='mt-6 rounded-2xl border-destructive/30 bg-destructive/10 text-foreground animate-shake'
            variant='destructive'
          >
            <AlertDescription className='text-foreground'>{errorBanner}</AlertDescription>
          </Alert>
        ) : null}

        {children}

        {status === RiftClientState.CONNECTED ? (
          <div className='mt-8 flex flex-col items-center animate-in fade-in zoom-in duration-500'>
            <div className='flex h-24 w-24 items-center justify-center rounded-full bg-accent/20 text-accent mb-6'>
              <CheckCircle2 className='h-12 w-12' />
            </div>
            <Card className='w-full rounded-2xl border-secondary bg-secondary/60 p-6 text-center text-foreground'>
              <p className='text-lg mb-6'>{t(($) => $.connect.dashboardCtaBody)}</p>
              <Button
                asChild
                className='h-14 w-full sm:w-auto rounded-2xl bg-gradient-to-b from-primary to-gold-dim px-8 font-display text-lg text-background shadow-lg transition hover:from-foreground hover:to-primary'
              >
                <Link to='/connected'>{t(($) => $.connect.dashboardCtaButton)}</Link>
              </Button>
            </Card>
          </div>
        ) : null}
      </section>
    </main>
  )
}
