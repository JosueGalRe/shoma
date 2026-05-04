import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useReadyCheck } from '@/features/ready-check'

function ReadyCheckRouteComponent() {
  const { t } = useTranslation()
  const { accept, decline, error, isLoading, status, timer } = useReadyCheck()

  return (
    <main className='flex min-h-[calc(100vh-4rem)] items-center justify-center p-4'>
      <Card className='w-full max-w-sm text-center'>
        <CardHeader>
          <CardTitle className='text-2xl'>{t('readyCheck.title')}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-2'>
            <div className='text-6xl font-bold tabular-nums'>{status === 'expired' ? t('readyCheck.expired') : timer}</div>
            <p className='text-sm text-muted-foreground'>{status === 'pending' ? t('readyCheck.waiting') : t('readyCheck.expired')}</p>
          </div>

          {error ? <p className='text-sm text-destructive'>{error.message}</p> : null}

          {status === 'pending' ? (
            <div className='space-y-3'>
              <Button
                className='h-14 w-full bg-green-600 text-white hover:bg-green-700'
                disabled={isLoading}
                onClick={() => {
                  void accept()
                }}
                type='button'
              >
                {t('readyCheck.accept')}
              </Button>
              <Button
                className='h-14 w-full'
                disabled={isLoading}
                onClick={() => {
                  void decline()
                }}
                type='button'
                variant='destructive'
              >
                {t('readyCheck.decline')}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  )
}

export const Route = createFileRoute('/connected/ready-check')({
  component: ReadyCheckRouteComponent,
})
