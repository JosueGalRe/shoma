import { tv } from 'tailwind-variants'

export const summonerPickerStyles = tv({
  slots: {
    root: 'space-y-2',
    sectionTitle: 'font-display text-primary text-sm font-medium tracking-[0.18em] uppercase',
    spellList: 'space-y-3',
    spellLabel: 'text-muted block text-sm',
    spellField: 'mt-1',
    spellButton:
      'border-border bg-background flex min-h-[44px] w-full items-center gap-3 rounded-md border p-2 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
    spellButtonImage: 'border-primary/40 bg-background size-12 rounded-md border object-cover shadow-md',
    spellButtonText: 'text-sm',
  },
  variants: {
    active: {
      true: {
        spellButton: 'border-primary/50 bg-secondary/60',
        spellButtonText: 'text-foreground',
      },
      false: {
        spellButton: 'hover:border-primary/50 hover:bg-secondary/50',
        spellButtonText: 'text-muted',
      },
    },
  },
  defaultVariants: {
    active: false,
  },
})
