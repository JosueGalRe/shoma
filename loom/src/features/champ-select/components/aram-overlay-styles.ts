import { tv } from 'tailwind-variants'

export const aramOverlayStyles = tv({
  slots: {
    benchGrid: 'grid grid-cols-5 gap-2',
    benchImage: 'size-full object-cover',
    benchItem: 'border-border bg-secondary/70 aspect-square overflow-hidden rounded-md border',
    benchSection: 'space-y-2',
    benchTitle: 'text-muted font-display text-[11px] tracking-[0.24em] uppercase',
    body: 'flex flex-1 flex-col gap-4 overflow-y-auto p-3',
    card: 'border-border bg-secondary/70 relative flex-1 overflow-hidden rounded-lg border',
    cardName:
      'text-foreground font-display absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/85 to-transparent px-2 pt-6 pb-2 text-center text-sm tracking-[0.14em] uppercase',
    cardSplash: 'absolute inset-0 size-full object-cover object-top',
    cards: 'flex min-h-[280px] gap-2',
    closeButton: 'text-muted hover:text-foreground flex size-11 items-center justify-center',
    closeIcon: 'size-5',
    header: 'border-border flex items-center justify-between border-b px-3 py-1',
    root: 'bg-background fixed inset-0 z-30 flex flex-col',
    title: 'font-display text-foreground text-sm tracking-[0.24em] uppercase',
  },
})
