import { tv } from 'tailwind-variants'

export const finalizationViewStyles = tv({
  slots: {
    carousel:
      'absolute right-0 bottom-0 left-0 flex [scrollbar-width:none] gap-2 overflow-x-auto bg-gradient-to-t from-black/85 via-black/50 to-transparent px-2 pt-6 pb-2 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
    hero: 'border-border relative min-h-0 flex-1 overflow-hidden rounded-lg border',
    heroImage: 'absolute inset-0 size-full object-cover object-top',
    heroName:
      'text-foreground font-display absolute top-1 left-2 text-lg tracking-[0.18em] uppercase drop-shadow-[0_2px_4px_black]',
    root: 'flex flex-1 flex-col gap-2 overflow-hidden p-3',
    skinButton: 'border-border bg-secondary/70 relative w-20 shrink-0 overflow-hidden rounded-md border',
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
