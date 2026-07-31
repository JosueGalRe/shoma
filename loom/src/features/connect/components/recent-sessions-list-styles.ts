import { tv } from 'tailwind-variants'

export const recentSessionsListStyles = tv({
  slots: {
    code: 'text-muted font-mono text-xs tracking-widest',
    deviceName: 'text-text truncate text-sm font-semibold',
    header: 'text-muted text-center text-xs tracking-[0.2em] uppercase',
    item: 'border-border-gold/20 bg-surface/40 hover:bg-surface/60 flex w-full items-center rounded-lg border backdrop-blur-sm transition-colors',
    itemText: 'flex min-w-0 flex-col items-start gap-0.5',
    list: 'flex flex-col gap-2',
    reconnectButton:
      'flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3 transition-transform active:scale-[0.98]',
    reconnectLabel: 'text-primary shrink-0 text-xs font-bold tracking-wider uppercase',
    removeButton: 'text-muted hover:text-text shrink-0 self-stretch px-3 text-lg leading-none transition-colors',
    root: 'flex w-full max-w-sm flex-col gap-4',
  },
})
