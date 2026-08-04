import { tv } from 'tailwind-variants'

export const rosterRowStyles = tv({
  slots: {
    content: 'relative z-10 flex h-full items-center gap-3 px-2',
    info: 'flex min-w-0 flex-1 flex-col justify-center',
    name: 'text-foreground truncate text-sm font-semibold tracking-wide',
    portrait:
      'border-border bg-secondary/80 flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md border-2',
    portraitImage: 'size-full object-cover',
    role: 'text-muted truncate text-[11px] tracking-[0.14em] uppercase',
    root: 'border-border bg-secondary/70 relative h-16 overflow-hidden rounded-lg border',
    scrim: 'absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/15',
    spellIcon: 'border-border size-6 rounded border object-cover',
    spells: 'flex shrink-0 flex-col gap-1',
    splash: 'absolute inset-0 size-full object-cover object-[25%_20%]',
  },
  variants: {
    activeTurn: {
      true: {
        root: 'border-primary ring-primary/60 ring-2',
      },
    },
    intent: {
      true: {
        portrait: 'border-dashed opacity-80',
      },
    },
    locked: {
      true: {
        portrait: 'border-primary',
      },
    },
  },
})
