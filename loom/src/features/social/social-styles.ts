import { tv } from 'tailwind-variants'

export const socialPanelStyles = tv({
  slots: {
    root: 'border-border bg-background/95 flex h-full min-h-[28rem] flex-col overflow-hidden rounded-sm border shadow-md',
    header: 'border-border bg-secondary/90 border-b p-4',
    error: 'border-destructive/30 bg-destructive/10 text-destructive border-b px-4 py-3 text-sm',
    content: 'min-h-0 flex-1 overflow-hidden',
  },
})

export const socialStatusBadgeStyles = tv({
  base: 'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium',
  variants: {
    disconnected: {
      true: 'border-accent/30 bg-accent/10 text-accent',
      false: 'border-primary/30 bg-primary/10 text-primary',
    },
  },
})

export const socialConnectionDotStyles = tv({
  base: 'h-2 w-2 rounded-full',
  variants: {
    disconnected: {
      true: 'bg-accent',
      false: 'bg-primary',
    },
  },
})

export const socialStatusDotStyles = tv({
  base: 'h-2 w-2 rounded-full',
  variants: {
    status: {
      online: 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.45)]',
      away: 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.45)]',
      offline: 'bg-lol-text-muted',
    },
  },
})

export const socialPanelHeaderStyles = tv({
  slots: {
    root: 'flex items-start justify-between gap-3',
    titleEyebrow: 'text-muted text-xs font-medium tracking-[0.24em] uppercase',
    title: 'font-display text-primary text-lg tracking-wider',
    actions: 'flex items-center gap-2',
    settingsButton: 'border-border bg-secondary hover:bg-secondary size-7 rounded-full',
    settingsIcon: 'text-muted size-3.5',
    settingsContent: 'border-border bg-secondary text-foreground w-56',
    settingsLabel: 'text-muted',
    settingsItem: 'hover:bg-secondary focus:bg-secondary cursor-pointer',
    offlineNotice: 'border-border bg-background/80 text-muted mt-3 flex items-center gap-2 rounded-sm border px-3 py-2 text-xs',
    offlineIcon: 'text-accent size-3.5',
  },
})

export const socialTabBarStyles = tv({
  slots: {
    root: 'mt-4 grid grid-cols-2 gap-2',
  },
})

export const socialTabButtonStyles = tv({
  base: 'focus-visible:ring-ring inline-flex items-center justify-center gap-2 rounded-sm border px-3 py-2 text-sm font-medium transition-all focus-visible:ring-2 focus-visible:outline-none',
  variants: {
    active: {
      true: 'border-primary bg-secondary text-primary shadow-[0_0_20px_var(--shoma-primary)]',
      false: 'border-border text-muted hover:text-foreground',
    },
  },
})

export const socialTabIconStyles = tv({
  base: 'size-4',
})

export const friendsListStyles = tv({
  slots: {
    root: 'space-y-3',
    emptyState: 'border-border bg-secondary/40 rounded-sm border border-dashed p-5 text-center',
    emptyTitle: 'font-display text-primary text-base',
    emptyText: 'text-muted mt-2 text-sm',
    group: 'border-border bg-secondary/40 rounded-sm border',
    groupButton:
      'focus-visible:ring-ring flex w-full items-center justify-between px-3 py-2 text-left focus-visible:ring-2 focus-visible:outline-none',
    groupTitle: 'font-display text-primary text-sm tracking-wider',
    groupCount: 'text-muted inline-flex items-center gap-2 text-xs',
    groupContent: 'border-border border-t p-2',
    groupEmpty: 'text-muted px-2 py-3 text-sm',
    friendList: 'space-y-2',
    friendRow: 'flex items-center gap-3 rounded-sm border px-2 py-2 transition-colors duration-150',
    friendButton:
      'focus-visible:ring-ring flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:ring-2 focus-visible:outline-none',
    friendInfo: 'min-w-0 flex-1',
    friendName: 'text-foreground block truncate text-sm font-medium',
    friendStatus: 'text-muted mt-1 flex items-center gap-1.5 text-xs',
    inviteButton: 'h-11 min-w-11 px-2 text-xs sm:h-8 sm:min-w-0',
    chevron: 'h-4 w-4 transition-transform',
  },
})

export const friendsListFriendRowStyles = tv({
  base: 'flex items-center gap-3 rounded-sm border px-2 py-2 transition-colors duration-150',
  variants: {
    selected: {
      true: 'border-primary bg-secondary/70',
      false: 'border-transparent hover:border-border hover:bg-secondary/40',
    },
  },
})

export const friendsListInviteButtonStyles = tv({
  base: 'h-11 min-w-11 px-2 text-xs sm:h-8 sm:min-w-0',
})

export const friendsListChevronStyles = tv({
  base: 'h-4 w-4 transition-transform',
  variants: {
    collapsed: {
      true: '-rotate-90',
      false: 'rotate-0',
    },
  },
})

export const chatPanelStyles = tv({
  slots: {
    root: 'flex h-full min-h-0 flex-col overflow-hidden',
    header: 'border-border border-b px-4 py-3',
    headerEmpty: 'text-muted text-sm',
    messageList: 'min-h-0 flex-1 overflow-y-auto p-4',
    emptyState: 'border-border bg-secondary/40 text-muted rounded-sm border border-dashed p-5 text-center text-sm',
    systemMessage: 'flex justify-center py-2',
    systemLabel: 'text-muted text-xs tracking-wide uppercase',
    messageRow: 'flex',
    messageBubble: 'max-w-[85%] rounded-sm border px-3 py-2 text-sm',
    messageText: 'break-words',
    timestamp: 'text-muted mt-1 block text-[0.65rem] tracking-wide uppercase',
    form: 'border-border flex gap-2 border-t p-3',
  },
})

export const chatMessageListStyles = tv({
  base: 'min-h-0 flex-1 overflow-y-auto p-4',
  variants: {
    active: {
      true: 'flex flex-col-reverse gap-3',
      false: 'space-y-3',
    },
  },
})

export const chatMessageBubbleStyles = tv({
  base: 'max-w-[85%] rounded-sm border px-3 py-2 text-sm',
  variants: {
    outgoing: {
      true: 'border-primary bg-secondary text-foreground',
      false: 'border-border bg-secondary text-muted',
    },
  },
})
