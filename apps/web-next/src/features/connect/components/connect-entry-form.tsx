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
          className='font-display h-14 w-full rounded-2xl border border-[#785a28]/50 bg-[#010a13]/60 px-4 text-center text-2xl tracking-[0.35em] text-[#f0e6d2] shadow-inner shadow-black/30 outline-none transition placeholder:text-[#785a28]/50 focus:border-[#c8a96e] focus:ring-2 focus:ring-[#c8a96e]/20'
          aria-label='Connection code'
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
        {codeError ? <p className='mt-1 text-sm text-[#d32f2f]'>{codeError.message}</p> : null}
      </div>
      <Button
        className='h-14 shrink-0 rounded-2xl bg-gradient-to-b from-[#c8a96e] to-[#785a28] px-6 font-display text-lg text-[#010a13] shadow-lg transition hover:from-[#f0e6d2] hover:to-[#c8a96e] disabled:cursor-not-allowed disabled:opacity-50'
        disabled={code.length !== 6}
        type='submit'
      >
        {t(($) => $.connect.form.connect)}
      </Button>
      <Button
        variant='outline'
        className='font-display h-14 shrink-0 rounded-2xl border border-[#785a28]/50 px-6 text-lg text-[#a09b8c] transition hover:border-[#c8a96e] hover:text-[#f0e6d2]'
        onClick={onCancel}
        type='button'
      >
        {t(($) => $.connect.form.cancel)}
      </Button>
    </form>
  )
}
