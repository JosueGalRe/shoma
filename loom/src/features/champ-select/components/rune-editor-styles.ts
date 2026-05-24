import { tv } from 'tailwind-variants'

export const runeEditorStyles = tv({
  slots: {
    tabButton: 'pb-2 text-sm font-medium tracking-wider uppercase transition-colors',
    recommendedCard: 'border-border bg-secondary/60 relative flex cursor-not-allowed flex-col gap-y-2 rounded border p-4 opacity-50',
    comingSoonBadge: 'bg-secondary/80 text-muted rounded px-3 py-1 text-xs font-medium tracking-wider uppercase',
  },
  variants: {
    active: {
      true: {
        tabButton: 'border-primary text-primary border-b-2',
      },
      false: {
        tabButton: 'text-muted hover:text-foreground',
      },
    },
  },
})
