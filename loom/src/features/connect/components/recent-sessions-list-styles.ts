import { tv } from 'tailwind-variants'

export const recentSessionsListStyles = tv({
  slots: {
    code: 'text-text font-mono text-lg tracking-widest',
    header: 'text-muted text-center text-xs tracking-[0.2em] uppercase',
    item: 'border-border-gold/20 bg-surface/40 hover:bg-surface/60 flex w-full items-center justify-between rounded-lg border px-4 py-3 backdrop-blur-sm transition-colors active:scale-[0.98]',
    list: 'flex flex-col gap-2',
    reconnectLabel: 'text-primary text-xs font-bold tracking-wider uppercase',
    root: 'flex w-full max-w-sm flex-col gap-4',
  },
})
