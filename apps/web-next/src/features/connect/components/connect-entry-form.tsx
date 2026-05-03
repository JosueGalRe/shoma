import type { FieldError, UseFormHandleSubmit, UseFormRegister } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import type { ConnectionFormValues } from '../connect-types'
import { cn } from '@/lib/utils'

type ConnectEntryFormProps = {
  code: string
  codeError?: FieldError
  register: UseFormRegister<ConnectionFormValues>
  handleSubmit: UseFormHandleSubmit<ConnectionFormValues>
  onSubmit: (values: ConnectionFormValues) => Promise<void>
  onCancel: () => void
  isPendingState?: boolean
  isErrorState?: boolean
}

export function ConnectEntryForm({ code, codeError, register, handleSubmit, onSubmit, onCancel, isPendingState, isErrorState }: ConnectEntryFormProps) {
  const { t } = useTranslation()

  return (
    <form className='mt-8 flex flex-col gap-4' onSubmit={handleSubmit(onSubmit)}>
      <div className={cn('w-full transition-all duration-300', isPendingState && 'animate-connection-wave rounded-2xl', isErrorState && 'animate-shake')}>
        <Input
          className={cn(
            'otp-input h-24 w-full rounded-2xl text-4xl tracking-[0.5em] shadow-inner shadow-black/30 placeholder:text-gold-dim/50',
            isPendingState && 'opacity-80 pointer-events-none',
            isErrorState && 'border-destructive focus:border-destructive focus:ring-destructive/20'
          )}
          aria-label='Connection code'
          inputMode='numeric'
          maxLength={6}
          placeholder={t(($) => $.connect.form.placeholder)}
          disabled={isPendingState}
          {...register('code', {
            required: t(($) => $.connect.form.required),
            pattern: {
              value: /^\d{6}$/,
              message: t(($) => $.connect.form.invalid),
            },
          })}
          onInput={(event) => {
            const target = event.target as HTMLInputElement
            target.value = target.value.replace(/\D/g, '').slice(0, 6)
          }}
        />
      </div>
      {codeError ? <p className='text-center text-sm text-destructive animate-shake'>{codeError.message}</p> : null}
      
      {!isPendingState && (
        <div className='flex flex-col sm:flex-row gap-3 mt-2'>
          <Button
            className='h-14 flex-1 rounded-2xl bg-gradient-to-b from-primary to-gold-dim px-6 font-display text-lg text-background shadow-lg transition hover:from-foreground hover:to-primary disabled:cursor-not-allowed disabled:opacity-50'
            disabled={code.length !== 6}
            type='submit'
          >
            {t(($) => $.connect.form.connect)}
          </Button>
          <Button
            variant='outline'
            className='font-display h-14 flex-1 rounded-2xl border border-gold-dim/50 px-6 text-lg transition hover:border-primary hover:text-foreground'
            onClick={onCancel}
            type='button'
          >
            {t(($) => $.connect.form.cancel)}
          </Button>
        </div>
      )}
    </form>
  )
}
