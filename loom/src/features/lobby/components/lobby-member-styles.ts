import { tv } from 'tailwind-variants'

export const lobbyMemberStyles = tv({
  slots: {
    item: 'border-border bg-secondary/40 flex items-center gap-3 rounded-md border p-3',
    avatarWrapper: 'relative',
    climbIndicator: 'bg-secondary absolute -right-1 -bottom-1 rounded-full p-0.5',
    content: 'min-w-0 flex-1 space-y-2',
    header: 'flex items-start justify-between gap-3',
    memberInfo: 'min-w-0',
    name: 'text-foreground truncate font-medium',
    role: 'text-muted text-xs',
    badges: 'flex shrink-0 items-center gap-2',
    roles: 'flex flex-wrap gap-2',
    actions: 'flex shrink-0 gap-2',
  },
})
