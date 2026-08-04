import { tv } from 'tailwind-variants'

export const finalizationViewStyles = tv({
  slots: {
    carousel: 'flex [scrollbar-width:none] gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
    hero: 'border-border relative min-h-0 flex-1 overflow-hidden rounded-lg border',
    heroImage: 'absolute inset-0 size-full object-cover object-top',
    heroName:
      'text-foreground font-display absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/85 to-transparent px-3 pt-8 pb-2 text-lg tracking-[0.18em] uppercase',
    root: 'flex flex-1 flex-col gap-3 overflow-hidden p-3',
    skinButton: 'border-border bg-secondary/70 relative w-24 shrink-0 overflow-hidden rounded-md border',
    skinImage: 'aspect-[16/9] w-full object-cover object-top',
    skinName: 'text-foreground block truncate px-1 py-1 text-center text-[10px]',
    title: 'text-muted font-display text-[11px] tracking-[0.24em] uppercase',
  },
  variants: {
    selected: {
      true: {
        skinButton: 'border-primary ring-primary/50 ring-1',
      },
    },
  },
})
