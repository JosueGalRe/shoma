import { tv } from 'tailwind-variants'

export const championIdentityStyles = tv({
  slots: {
    fallback: 'border-primary/40 bg-background flex shrink-0 items-center justify-center rounded-full border',
    fallbackIcon: 'text-primary',
    identityText: 'min-w-0',
    loadingText: 'space-y-1',
    name: 'font-display text-foreground truncate text-sm font-medium tracking-[0.14em] uppercase',
    root: 'flex items-center gap-3',
    title: 'text-muted truncate text-xs capitalize',
  },
})
