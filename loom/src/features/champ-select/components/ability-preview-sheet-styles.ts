import { tv } from 'tailwind-variants'

export const abilityPreviewSheetStyles = tv({
  slots: {
    error: 'text-muted py-8 text-center',
    loadingContent: 'flex-1 space-y-2 py-1',
    loadingIcon: 'bg-secondary size-12 shrink-0 rounded',
    loadingItem: 'flex gap-3',
    loadingLine: 'bg-secondary h-3 w-full rounded',
    loadingLineNarrow: 'bg-secondary h-3 w-5/6 rounded',
    loadingRoot: 'animate-pulse space-y-4',
    loadingTitle: 'bg-secondary h-4 w-1/3 rounded',
    spellContent: 'flex-1',
    spellDescription: 'text-muted line-clamp-3 text-xs',
    spellIconWrap: 'relative shrink-0',
    spellImage: 'border-border size-12 rounded border object-cover',
    spellKey:
      'bg-background border-border text-primary absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded border text-[10px] font-bold',
    spellName: 'font-display text-foreground text-sm font-medium',
    spellRow: 'flex gap-3',
  },
})
