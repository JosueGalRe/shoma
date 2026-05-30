import { tv } from 'tailwind-variants'

import type { ConnectionTone } from '../connect-types'

export const connectScreenStyles = tv({
  defaultVariants: {
    tone: 'idle',
  },
  slots: {
    actions: 'flex w-full flex-col gap-3',
    cancelButton: 'h-12 w-full font-bold tracking-widest uppercase active:scale-[0.98]',
    card: 'border-border-gold/30 bg-surface/60 w-full max-w-sm border shadow-[0_0_50px_rgba(200,170,110,0.25)] backdrop-blur-2xl',
    codeLabel: 'text-muted block text-xs tracking-[0.35em] uppercase',
    codeSection: 'w-full space-y-2 text-center',
    connectButton:
      'border-primary h-12 w-full font-bold tracking-[0.2em] uppercase hover:shadow-[0_0_15px_rgba(200,170,110,0.5)] active:scale-[0.98]',
    content: 'flex flex-col items-center gap-5 px-6 pt-12 pb-6',
    errorMessage: 'text-destructive text-center text-sm',
    footer: 'text-muted/60 text-center text-[10px] tracking-widest uppercase',
    installButton: 'w-full',
    otpGroup: 'gap-4',
    otpSlot:
      'border-border-gold/50 bg-surface-elevated/50 text-text data-[active=true]:border-primary data-[active=true]:ring-primary/50 h-11 w-10 rounded border text-center text-xl font-medium shadow-inner backdrop-blur-sm data-[active=true]:ring-2',
    otpWrap: 'flex justify-center py-2',
    root: 'flex flex-1 flex-col items-center justify-center gap-8 px-4 py-10',
    statusDot: 'relative inline-flex size-2 rounded-full',
    statusDotWrap: 'relative flex size-3 items-center justify-center',
    statusPing: 'absolute inline-flex h-full w-full animate-ping rounded-full opacity-40',
    statusRow: 'flex items-center gap-2',
    statusText: 'text-xs font-medium tracking-wider uppercase',
    title: 'font-display text-primary text-5xl font-semibold tracking-wider drop-shadow-[0_0_15px_rgba(200,170,110,0.4)]',
    titleWrap: 'text-center',
    version: 'text-muted/40 text-center text-[9px] tracking-widest uppercase',
    versionLink:
      'hover:text-muted/60 focus-visible:ring-primary transition-colors focus-visible:ring-1 focus-visible:outline-none',
  },
  variants: {
    tone: {
      connected: {
        statusDot: 'bg-primary',
        statusPing: 'bg-primary',
        statusText: 'text-primary',
      },
      connecting: {
        statusDot: 'bg-accent',
        statusPing: 'bg-accent',
        statusText: 'text-accent',
      },
      error: {
        statusDot: 'bg-destructive',
        statusPing: 'bg-destructive',
        statusText: 'text-destructive',
      },
      handshaking: {
        statusDot: 'bg-primary',
        statusPing: 'bg-primary',
        statusText: 'text-primary',
      },
      idle: {
        statusDot: 'bg-muted',
        statusPing: 'bg-muted',
        statusText: 'text-muted',
      },
    } satisfies Record<ConnectionTone, Record<'statusPing' | 'statusDot' | 'statusText', string>>,
  },
})
