import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

type ConnectionActionsProps = {
  mode: 'failure' | 'pending'
  onRetry: () => void
  onCancel: () => void
}

export function ConnectionActions({ mode, onRetry, onCancel }: ConnectionActionsProps) {
  const { t } = useTranslation()

  if (mode === 'failure') {
    return (
      <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
        <Button
          className='bg-secondary font-display text-foreground hover:bg-hextech-light h-14 shrink-0 rounded-2xl px-6 text-lg transition'
          onClick={onRetry}
          type='button'
        >
          {t(($) => $.connect.actions.retry)}
        </Button>
        <Button
          variant='outline'
          className='font-display h-14 shrink-0 rounded-2xl border border-gold-dim/50 px-6 text-lg transition hover:border-primary hover:text-foreground'
          onClick={onCancel}
          type='button'
        >
          {t(($) => $.connect.actions.cancel)}
        </Button>
      </div>
    )
  }

  return (
    <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
      <Button
        variant='outline'
        className='font-display h-14 shrink-0 rounded-2xl border border-gold-dim/50 px-6 text-lg transition hover:border-primary hover:text-foreground'
        onClick={onCancel}
        type='button'
      >
        {t(($) => $.connect.actions.cancel)}
      </Button>
    </div>
  )
}
