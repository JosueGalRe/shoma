import { tv } from 'tailwind-variants'

export const lobbyBottomSheetsStyles = tv({
  slots: {
    empty: 'text-muted py-6 text-center text-sm',
    inviteActions: 'flex shrink-0 gap-2',
    inviteItem:
      'flex items-center justify-between gap-3 rounded-xl border border-[color-mix(in_srgb,rgb(200,170,110)_20%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_40%,transparent)] p-3 text-sm',
    inviteName: 'text-foreground truncate',
    sectionLabel:
      'mb-2 text-xs font-bold tracking-[0.15em] text-[color-mix(in_srgb,rgb(200,170,110)_70%,transparent)] uppercase',
  },
})
