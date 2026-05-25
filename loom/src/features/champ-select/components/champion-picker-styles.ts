import { tv } from 'tailwind-variants'

export const championPickerFilterStyles = tv({
  slots: {
    button: 'h-11 shrink-0 rounded-full border px-4 text-sm transition-colors',
    divider: 'bg-border mx-1 w-px shrink-0',
    input: 'border-border bg-background text-foreground placeholder:text-muted h-11',
    list: 'scrollbar-hide flex gap-2 overflow-x-auto pb-2',
    root: 'space-y-3',
  },
  variants: {
    active: {
      false: {
        button: 'border-border text-muted hover:text-foreground',
      },
      true: {
        button: 'border-primary bg-secondary/60 text-primary',
      },
    },
  },
})

export const championPickerAramSelectedStyles = tv({
  slots: {
    card: 'border-primary bg-secondary/60 overflow-hidden rounded-md border shadow-[0_0_20px_var(--shoma-primary)]',
    content: 'p-3',
    image: 'h-48 w-full object-cover',
    name: 'font-display text-primary text-lg font-semibold tracking-[0.18em] uppercase',
    title: 'text-muted text-sm',
  },
})

export const championPickerAramStyles = tv({
  slots: {
    badge: 'text-accent flex items-center gap-1 text-xs font-semibold',
    badgeIcon: 'size-3',
    blessed: 'text-primary text-xs font-semibold',
    card: 'bg-secondary/60 hover:border-primary focus-visible:ring-ring overflow-hidden rounded-md border text-left transition-all duration-150 hover:shadow-[0_0_20px_var(--shoma-primary)] focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50',
    content: 'space-y-2 p-2',
    description: 'text-muted text-sm',
    drawButton: 'w-full',
    grid: 'grid grid-cols-1 gap-2 sm:grid-cols-3',
    image: 'h-28 w-full object-cover',
    name: 'font-display text-foreground truncate text-sm font-medium tracking-[0.14em] uppercase',
    selectHint: 'text-muted text-xs',
  },
  variants: {
    tone: {
      blessed: {
        card: 'border-primary shadow-[0_0_20px_var(--shoma-primary)]',
      },
      bravery: {
        card: 'border-accent shadow-[0_0_20px_var(--shoma-accent)]',
      },
      crowdFavorite: {
        card: 'border-accent shadow-[0_0_20px_var(--shoma-accent)]',
      },
      default: {
        card: 'border-border',
      },
    },
  },
})

export const championPickerCardStyles = tv({
  slots: {
    card: 'bg-secondary/60 hover:border-primary focus-visible:ring-ring relative w-full overflow-hidden rounded-md border text-left transition-all duration-150 hover:shadow-[0_0_20px_var(--shoma-primary)] focus-visible:ring-2 focus-visible:outline-none',
    cell: 'relative flex',
    content: 'p-2',
    grid: 'grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4',
    image: 'h-20 w-full object-cover',
    imageWrap: 'relative',
    label: 'text-muted text-xs',
    name: 'font-display text-foreground truncate text-sm font-medium tracking-[0.12em] uppercase',
    overlay: 'absolute inset-0 flex items-center justify-center',
    overlayIcon: 'size-8 drop-shadow-md',
    overlayLabel: 'font-display text-sm font-bold tracking-widest drop-shadow-md',
    shieldHitArea: 'absolute inset-0 z-10 cursor-not-allowed',
  },
  variants: {
    selected: {
      false: {
        card: 'border-border',
      },
      true: {
        card: 'border-primary shadow-[0_0_20px_var(--shoma-primary)]',
      },
    },
    state: {
      available: {},
      banned: {
        card: 'grayscale',
        overlay: 'bg-destructive/10',
        overlayLabel: 'text-destructive',
      },
      picked: {
        card: 'opacity-50',
        overlay: 'bg-background/80',
        overlayLabel: 'text-muted',
      },
      shielded: {
        overlay: 'bg-background/80',
        overlayIcon: 'text-primary',
      },
    },
  },
})

export const championPickerToastStyles = tv({
  base: 'bg-secondary text-primary fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2 text-sm shadow-lg',
})
