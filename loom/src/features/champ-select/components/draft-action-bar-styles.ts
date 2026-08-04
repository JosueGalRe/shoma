import { tv } from 'tailwind-variants'

export const draftActionBarStyles = tv({
  slots: {
    action: 'font-display min-h-12 flex-1 text-sm tracking-[0.2em] uppercase',
    loadout: 'flex shrink-0 gap-2',
    loadoutButton: 'size-12 p-0',
    loadoutIcon: 'size-5',
    root: 'border-border bg-background/95 sticky bottom-0 z-20 flex items-center gap-2 border-t p-2 backdrop-blur',
  },
})
