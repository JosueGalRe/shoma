import { tv } from 'tailwind-variants'

export const lobbyQueueCardStyles = tv({
  slots: {
    section: 'shrink-0 px-4 py-2',
    card: 'rounded-xl border p-3',
    statusRow: 'mb-3 flex items-center justify-between gap-2',
    statusLead: 'flex items-center gap-2',
    statusDot: 'h-2 w-2 rounded-full',
    statusLabel: 'text-sm font-medium',
    searchingLabel: 'font-display text-sm',
    penalty: 'text-destructive mt-2 text-center text-xs',
    button: 'w-full',
  },
  variants: {
    queueStatus: {
      open: {
        card: 'border-border bg-secondary/60',
        statusDot: 'bg-primary/70',
        statusLabel: 'text-foreground',
      },
      closed: {
        card: 'border-border/70 bg-secondary/50',
        statusDot: 'bg-muted',
        statusLabel: 'text-muted',
      },
      searching: {
        card: 'border-primary/60 bg-secondary/80',
        statusDot: 'bg-primary animate-pulse',
        statusLabel: 'text-foreground',
        searchingLabel: 'text-primary',
      },
    },
  },
})
