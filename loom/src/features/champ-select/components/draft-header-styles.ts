import { tv } from 'tailwind-variants'

export const draftHeaderStyles = tv({
  slots: {
    banRow: 'flex shrink-0 items-center gap-1',
    center: 'flex min-w-0 flex-col items-center px-2',
    root: 'border-border bg-secondary/80 sticky top-0 z-20 flex items-center justify-between border-b px-2 py-2',
    subtitle: 'text-muted font-display max-w-32 truncate text-[10px] tracking-[0.18em] uppercase',
    timer: 'font-display text-2xl leading-none font-bold tabular-nums',
  },
  variants: {
    urgent: {
      true: {
        timer: 'text-destructive animate-pulse',
      },
    },
  },
})
