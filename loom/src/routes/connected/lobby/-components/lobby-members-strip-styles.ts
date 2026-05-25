import { tv } from 'tailwind-variants'

export const lobbyMembersStripStyles = tv({
  slots: {
    memberCard: 'border-border bg-secondary/40 flex w-[72px] shrink-0 flex-col items-center gap-1 rounded-lg border p-2',
    strip: 'shrink-0 px-4 py-2',
  },
})
