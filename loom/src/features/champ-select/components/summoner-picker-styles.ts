import { tv } from 'tailwind-variants'

export const summonerPickerStyles = tv({
  defaultVariants: {
    active: false,
  },
  slots: {
    root: 'space-y-2',
    sectionTitle: 'font-display text-primary text-sm font-medium tracking-[0.18em] uppercase',
    spellButton:
      'border-border bg-background focus-visible:ring-ring flex min-h-[44px] w-full items-center gap-3 rounded-md border p-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none',
    spellButtonImage: 'border-primary/40 bg-background size-12 rounded-md border object-cover shadow-md',
    spellButtonText: 'text-sm',
    spellField: 'mt-1',
    spellLabel: 'text-muted block text-sm',
    spellList: 'space-y-3',
  },
  variants: {
    active: {
      false: {
        spellButton: 'hover:border-primary/50 hover:bg-secondary/50',
        spellButtonText: 'text-muted',
      },
      true: {
        spellButton: 'border-primary/50 bg-secondary/60',
        spellButtonText: 'text-foreground',
      },
    },
  },
})
