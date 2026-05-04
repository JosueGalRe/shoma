import { useEffect, useRef, useState } from 'react'
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

const RECENT_CONNECTIONS_KEY = 'mimicRecentConnections'

export function ConnectEntryForm({ code, codeError, register, handleSubmit, onSubmit, onCancel, isPendingState, isErrorState }: ConnectEntryFormProps) {
  const { t } = useTranslation()
  const [recentConnections, setRecentConnections] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_CONNECTIONS_KEY)
      if (stored) {
        setRecentConnections(JSON.parse(stored))
      }
    } catch (e) {
      console.error('Failed to load recent connections:', e)
    }
  }, [])

  const handleFormSubmit = async (values: ConnectionFormValues) => {
    try {
      const stored = localStorage.getItem(RECENT_CONNECTIONS_KEY)
      let recents: string[] = stored ? JSON.parse(stored) : []
      recents = [values.code, ...recents.filter(c => c !== values.code)].slice(0, 3)
      localStorage.setItem(RECENT_CONNECTIONS_KEY, JSON.stringify(recents))
      setRecentConnections(recents)
    } catch (e) {
      console.error('Failed to save recent connection:', e)
    }
    await onSubmit(values)
  }

  const handleRecentClick = (recentCode: string) => {
    const input = inputRef.current
    if (input) {
      input.value = recentCode
      input.dispatchEvent(new Event('input', { bubbles: true }))
      setTimeout(() => {
        const form = input.closest('form')
        if (form) form.requestSubmit()
      }, 50)
    }
  }

  const { ref: registerRef, ...registerRest } = register('code', {
    required: t(($) => $.connect.form.required),
    pattern: {
      value: /^\d{6}$/,
      message: t(($) => $.connect.form.invalid),
    },
  })

  return (
    <form className='mt-8 flex flex-col gap-6' onSubmit={handleSubmit(handleFormSubmit)}>
      <div className={cn('w-full transition-all duration-300 relative', isPendingState && 'animate-connection-wave rounded-2xl', isErrorState && 'animate-shake')}>
        <Input
          className='absolute inset-0 opacity-0 w-full h-full cursor-text z-10'
          aria-label='Connection code'
          inputMode='numeric'
          maxLength={6}
          disabled={isPendingState}
          {...registerRest}
          ref={(e) => {
            registerRef(e)
            inputRef.current = e
          }}
          onPaste={(event) => {
            event.preventDefault()
            const pasted = event.clipboardData.getData('text')
            const cleaned = pasted.replace(/\D/g, '').slice(0, 6)
            const target = event.target as HTMLInputElement
            target.value = cleaned
            target.dispatchEvent(new Event('input', { bubbles: true }))
          }}
          onInput={(event) => {
            const target = event.target as HTMLInputElement
            const cleaned = target.value.replace(/\D/g, '').slice(0, 6)
            if (target.value !== cleaned) {
              target.value = cleaned
            }
          }}
        />
        
        <div className='flex justify-between gap-2 sm:gap-4 pointer-events-none'>
          {Array.from({ length: 6 }).map((_, i) => {
            const char = code[i] || ''
            const isActive = code.length === i || (code.length === 6 && i === 5)
            return (
              <div
                key={i}
                className={cn(
                  'flex h-16 w-12 sm:h-20 sm:w-16 items-center justify-center rounded-xl border-2 bg-card/80 text-3xl font-display transition-all duration-200',
                  char ? 'border-primary text-primary shadow-[0_0_15px_rgba(10,200,185,0.3)]' : 'border-border text-muted-foreground',
                  isActive && !isPendingState && 'border-primary/50 ring-2 ring-primary/20 ring-offset-2 ring-offset-background',
                  isErrorState && 'border-destructive text-destructive shadow-none'
                )}
              >
                {char}
              </div>
            )
          })}
        </div>
      </div>
      {codeError ? <p className='text-center text-sm text-destructive animate-shake'>{codeError.message}</p> : null}
      
      {!isPendingState && (
        <div className='flex flex-col gap-4 mt-2'>
          <div className='flex flex-col sm:flex-row gap-3'>
            <Button
              className='h-14 flex-1 rounded-2xl bg-gradient-to-b from-primary to-teal-dim px-6 font-display text-lg text-background shadow-lg transition hover:from-foreground hover:to-primary disabled:cursor-not-allowed disabled:opacity-50'
              disabled={code.length !== 6}
              type='submit'
            >
              {t(($) => $.connect.form.connect)}
            </Button>
            <Button
              variant='outline'
              className='font-display h-14 flex-1 rounded-2xl border border-border px-6 text-lg transition hover:border-primary hover:text-primary'
              onClick={onCancel}
              type='button'
            >
              {t(($) => $.connect.form.cancel)}
            </Button>
          </div>

          {recentConnections.length > 0 && (
            <div className='mt-4 flex flex-col items-center gap-3 animate-page-enter'>
              <p className='text-sm text-muted-foreground font-medium uppercase tracking-wider'>Recent Connections</p>
              <div className='flex flex-wrap justify-center gap-2'>
                {recentConnections.map((recentCode) => (
                  <Button
                    key={recentCode}
                    variant='outline'
                    type='button'
                    className='h-10 rounded-xl border-border bg-card/50 px-4 font-display tracking-widest hover:border-primary hover:text-primary transition-all'
                    onClick={() => handleRecentClick(recentCode)}
                  >
                    {recentCode}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </form>
  )
}
