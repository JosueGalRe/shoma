import { tv } from 'tailwind-variants'

export const championGridOverlayStyles = tv({
  slots: {
    card: 'border-border bg-secondary/70 flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-lg border p-1.5',
    cardImage: 'size-10 rounded-md object-cover',
    cardName: 'text-foreground w-full truncate text-center text-[10px] leading-tight',
    closeButton: 'text-muted hover:text-foreground flex size-11 items-center justify-center',
    closeIcon: 'size-5',
    grid: 'grid grid-cols-4 gap-2',
    gridWrap: 'flex-1 overflow-y-auto p-3',
    header: 'border-border flex items-center justify-between border-b px-3 py-1',
    root: 'bg-background fixed inset-0 z-30 flex flex-col',
    title: 'font-display text-foreground text-sm tracking-[0.24em] uppercase',
  },
  variants: {
    disabled: {
      true: {
        card: 'opacity-35 saturate-50',
      },
    },
    selected: {
      true: {
        card: 'border-primary ring-primary/50 ring-1',
        cardImage: 'ring-primary/40 ring-2',
      },
    },
  },
})
