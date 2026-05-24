import { tv } from 'tailwind-variants'

import type { ConnectionTone } from '../connect-types'

export const connectScreenStyles = tv({
  slots: {
    root: 'flex flex-1 items-center justify-center px-4 py-10',
    card: 'border-border-gold/30 bg-surface/60 w-full max-w-sm border shadow-[0_0_50px_rgba(200,170,110,0.25)] backdrop-blur-2xl',
    content: 'flex flex-col items-center gap-5 px-6 pt-12 pb-6',
    titleWrap: 'text-center',
    title: 'font-display text-primary text-5xl font-semibold tracking-wider drop-shadow-[0_0_15px_rgba(200,170,110,0.4)]',
    statusRow: 'flex items-center gap-2',
    statusDotWrap: 'relative flex size-3 items-center justify-center',
    statusPing: 'absolute inline-flex h-full w-full animate-ping rounded-full opacity-40',
    statusDot: 'relative inline-flex size-2 rounded-full',
    statusText: 'text-xs font-medium tracking-wider uppercase',
    errorMessage: 'text-destructive text-center text-sm',
    codeSection: 'w-full space-y-2 text-center',
    codeLabel: 'text-muted block text-xs tracking-[0.35em] uppercase',
    otpWrap: 'flex justify-center py-2',
    otpGroup: 'gap-4',
    otpSlot:
      'border-border-gold/50 bg-surface-elevated/50 text-text data-[active=true]:border-primary data-[active=true]:ring-primary/50 h-11 w-10 rounded border text-center text-xl font-medium shadow-inner backdrop-blur-sm data-[active=true]:ring-2',
    actions: 'flex w-full flex-col gap-3',
    connectButton:
      'border-primary h-12 w-full font-bold tracking-[0.2em] uppercase hover:shadow-[0_0_15px_rgba(200,170,110,0.5)] active:scale-[0.98]',
    cancelButton: 'h-12 w-full font-bold tracking-widest uppercase active:scale-[0.98]',
    installButton: 'w-full',
    footer: 'text-muted/60 text-center text-[10px] tracking-widest uppercase',
  },
  variants: {
    tone: {
      error: {
        statusPing: 'bg-destructive',
        statusDot: 'bg-destructive',
        statusText: 'text-destructive',
      },
      connecting: {
        statusPing: 'bg-accent',
        statusDot: 'bg-accent',
        statusText: 'text-accent',
      },
      handshaking: {
        statusPing: 'bg-primary',
        statusDot: 'bg-primary',
        statusText: 'text-primary',
      },
      connected: {
        statusPing: 'bg-primary',
        statusDot: 'bg-primary',
        statusText: 'text-primary',
      },
      idle: {
        statusPing: 'bg-muted',
        statusDot: 'bg-muted',
        statusText: 'text-muted',
      },
    } satisfies Record<ConnectionTone, Record<'statusPing' | 'statusDot' | 'statusText', string>>,
  },
  defaultVariants: {
    tone: 'idle',
  },
})
