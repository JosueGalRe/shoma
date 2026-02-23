import type { FieldError, UseFormHandleSubmit, UseFormRegister } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import type { ConnectionFormValues } from '../connect-types'

type ConnectEntryFormProps = {
  code: string
  codeError?: FieldError
  register: UseFormRegister<ConnectionFormValues>
  handleSubmit: UseFormHandleSubmit<ConnectionFormValues>
  onSubmit: (values: ConnectionFormValues) => Promise<void>
  onCancel: () => void
}

export function ConnectEntryForm({ code, codeError, register, handleSubmit, onSubmit, onCancel }: ConnectEntryFormProps) {
  const { t } = useTranslation()

  return (
    <form className='mt-8 flex flex-col gap-3 sm:flex-row' onSubmit={handleSubmit(onSubmit)}>
      <div className='w-full'>
        <Input
          className='font-display focus:border-brass focus:ring-brass/30 h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-center text-2xl tracking-[0.35em] transition outline-none focus:ring-2'
          inputMode='numeric'
          maxLength={6}
          placeholder={t(($) => $.connect.form.placeholder)}
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
        {codeError ? <p className='mt-1 text-sm text-red-700'>{codeError.message}</p> : null}
      </div>
      <Button
        className='bg-ink font-display text-mist hover:bg-slate h-14 shrink-0 rounded-2xl px-6 text-lg transition disabled:cursor-not-allowed disabled:bg-slate-400'
        disabled={code.length !== 6}
        type='submit'
      >
        {t(($) => $.connect.form.connect)}
      </Button>
      <Button
        variant='outline'
        className='font-display h-14 shrink-0 rounded-2xl border border-slate-300 px-6 text-lg text-slate-700 transition hover:border-slate-400'
        onClick={onCancel}
        type='button'
      >
        {t(($) => $.connect.form.cancel)}
      </Button>
    </form>
  )
}
