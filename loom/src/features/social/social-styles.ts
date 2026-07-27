import { tv } from 'tailwind-variants'

export const socialPanelStyles = tv({
  slots: {
    content: 'min-h-0 flex-1 overflow-hidden',
    error: 'border-destructive/30 bg-destructive/10 text-destructive border-b px-4 py-3 text-sm',
    header: 'border-border bg-secondary/90 border-b p-4',
    root: 'border-border bg-background/95 flex h-full min-h-[28rem] flex-col overflow-hidden rounded-sm border shadow-md',
  },
})

export const socialStatusBadgeStyles = tv({
  base: 'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium',
  variants: {
    disconnected: {
      false: 'border-primary/30 bg-primary/10 text-primary',
      true: 'border-accent/30 bg-accent/10 text-accent',
    },
  },
})

export const socialConnectionDotStyles = tv({
  base: 'h-2 w-2 rounded-full',
  variants: {
    disconnected: {
      false: 'bg-primary',
      true: 'bg-accent',
    },
  },
})

export const socialStatusDotStyles = tv({
  base: 'h-2 w-2 rounded-full',
  variants: {
    status: {
      away: 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.45)]',
      busy: 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.45)]',
      offline: 'bg-lol-text-muted',
      online: 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.45)]',
    },
  },
})

export const socialPanelHeaderStyles = tv({
  slots: {
    actions: 'flex items-center gap-2',
    offlineIcon: 'text-accent size-3.5',
    offlineNotice: 'border-border bg-background/80 text-muted mt-3 flex items-center gap-2 rounded-sm border px-3 py-2 text-xs',
    root: 'flex items-start justify-between gap-3',
    settingsButton: 'border-border bg-secondary hover:bg-secondary size-7 rounded-full',
    settingsContent: 'border-border bg-secondary text-foreground w-56',
    settingsIcon: 'text-muted size-3.5',
    settingsItem: 'hover:bg-secondary focus:bg-secondary cursor-pointer',
    settingsLabel: 'text-muted',
    title: 'font-display text-primary text-lg tracking-wider',
    titleEyebrow: 'text-muted text-xs font-medium tracking-[0.24em] uppercase',
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
      false: 'border-border text-muted hover:text-foreground',
      true: 'border-primary bg-secondary text-primary shadow-[0_0_20px_var(--shoma-primary)]',
    },
  },
})

export const socialTabIconStyles = tv({
  base: 'size-4',
})
export const socialUnreadBadgeStyles = tv({
  base: 'bg-primary text-primary-foreground ml-1 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[0.65rem] leading-none font-semibold',
})

export const friendsListStyles = tv({
  slots: {
    chevron: 'h-4 w-4 transition-transform',
    emptyState: 'border-border bg-secondary/40 rounded-sm border border-dashed p-5 text-center',
    emptyText: 'text-muted mt-2 text-sm',
    emptyTitle: 'font-display text-primary text-base',
    friendButton:
      'focus-visible:ring-ring flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:ring-2 focus-visible:outline-none',
    friendInfo: 'min-w-0 flex-1',
    friendList: 'space-y-2',
    friendName: 'text-foreground block truncate text-sm font-medium',
    friendRow: 'flex items-center gap-3 rounded-sm border px-2 py-2 transition-colors duration-150',
    friendStatus: 'text-muted mt-1 flex items-center gap-1.5 text-xs',
    group: 'border-border bg-secondary/40 rounded-sm border',
    groupButton:
      'focus-visible:ring-ring flex w-full items-center justify-between px-3 py-2 text-left focus-visible:ring-2 focus-visible:outline-none',
    groupContent: 'border-border border-t p-2',
    groupCount: 'text-muted inline-flex items-center gap-2 text-xs',
    groupEmpty: 'text-muted px-2 py-3 text-sm',
    groupTitle: 'font-display text-primary text-sm tracking-wider',
    inviteButton: 'h-11 min-w-11 px-2 text-xs sm:h-8 sm:min-w-0',
    root: 'space-y-3',
    sentInviteChip: 'text-accent flex h-11 min-w-11 items-center px-2 text-xs font-medium tracking-wide uppercase sm:h-8',
  },
})

export const friendsListFriendRowStyles = tv({
  base: 'flex items-center gap-3 rounded-sm border px-2 py-2 transition-colors duration-150',
  variants: {
    selected: {
      false: 'hover:border-border hover:bg-secondary/40 border-transparent',
      true: 'border-primary bg-secondary/70',
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
      false: 'rotate-0',
      true: '-rotate-90',
    },
  },
})
export const conversationsListStyles = tv({
  slots: {
    conversationButton:
      'focus-visible:ring-ring hover:border-border hover:bg-secondary/40 flex w-full items-center gap-3 rounded-sm border border-transparent px-2 py-2 text-left transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none',
    conversationHeader: 'flex items-baseline justify-between gap-2',
    conversationInfo: 'min-w-0 flex-1',
    conversationPreview: 'text-muted mt-1 block truncate text-xs',
    conversationTime: 'text-muted shrink-0 text-[0.65rem] tracking-wide uppercase',
    conversationTitle: 'text-foreground block truncate text-sm font-medium',
    emptyState: 'border-border bg-secondary/40 rounded-sm border border-dashed p-5 text-center',
    emptyText: 'text-muted mt-2 text-sm',
    emptyTitle: 'font-display text-primary text-base',
    groupIcon: 'border-border bg-secondary text-muted flex size-8 shrink-0 items-center justify-center rounded-full border-2',
    root: 'space-y-1',
  },
})

export const chatPanelStyles = tv({
  slots: {
    dateDivider: 'text-muted flex items-center gap-3 py-1 text-[0.65rem] font-medium tracking-widest uppercase',
    dateDividerLine: 'border-border flex-1 border-t',
    emptyState: 'border-border bg-secondary/40 text-muted rounded-sm border border-dashed p-5 text-center text-sm',
    form: 'border-border flex gap-2 border-t p-3',
    header: 'border-border border-b px-4 py-3',
    headerBackButton:
      'text-muted hover:text-foreground focus-visible:ring-ring -ml-1 flex size-7 shrink-0 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:outline-none',
    headerEmpty: 'text-muted text-sm',
    headerGroupIcon:
      'border-border bg-secondary text-muted flex size-8 shrink-0 items-center justify-center rounded-full border-2',
    messageBubble: 'max-w-[85%] rounded-sm border px-3 py-2 text-sm',
    messageSender: 'text-primary mb-0.5 block text-xs font-semibold',
    messageText: 'break-words',
    root: 'flex h-full min-h-0 flex-col overflow-hidden',
    timestamp: 'text-muted mt-1 block text-[0.65rem] tracking-wide uppercase',
  },
})

export const chatMessageRowStyles = tv({
  base: 'flex items-end gap-2',
  variants: {
    outgoing: {
      false: 'justify-start',
      true: 'justify-end',
    },
  },
})

export const chatMessageBubbleStyles = tv({
  base: 'max-w-[85%] rounded-sm border px-3 py-2 text-sm',
  variants: {
    outgoing: {
      false: 'border-border bg-secondary text-muted',
      true: 'border-primary bg-secondary text-foreground',
    },
  },
})
