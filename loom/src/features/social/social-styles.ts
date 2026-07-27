import { tv } from 'tailwind-variants'

export const socialPanelStyles = tv({
  slots: {
    content: 'min-h-0 flex-1 overflow-hidden',
    error: 'border-destructive/30 bg-destructive/10 text-destructive border-b px-4 py-3 text-sm',
    header: 'border-b border-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)] bg-transparent p-4',
    root: 'flex h-full min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)]',
    rootFlush: 'flex h-full min-h-0 flex-col overflow-hidden',
  },
})

export const socialStatusBadgeStyles = tv({
  base: 'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-bold tracking-widest uppercase',
  variants: {
    disconnected: {
      false:
        'border-[color-mix(in_srgb,rgb(200,170,110)_30%,transparent)] bg-[color-mix(in_srgb,rgb(200,170,110)_10%,transparent)] text-[rgb(200,170,110)]',
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
    offlineNotice:
      'mt-3 flex items-center gap-2 rounded-xl border border-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_40%,transparent)] px-3 py-2 text-xs text-[color-mix(in_srgb,rgb(200,170,110)_70%,transparent)]',
    root: 'flex items-start justify-end gap-3',
    settingsButton:
      'size-7 rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_40%,transparent)] hover:bg-[color-mix(in_srgb,rgb(10,20,40)_60%,transparent)]',
    settingsContent:
      'text-foreground w-56 border-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_90%,transparent)] backdrop-blur-md',
    settingsIcon: 'size-3.5 text-[color-mix(in_srgb,rgb(200,170,110)_70%,transparent)]',
    settingsItem:
      'cursor-pointer hover:bg-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)] focus:bg-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)]',
    settingsLabel: 'text-[color-mix(in_srgb,rgb(200,170,110)_70%,transparent)]',
  },
})

export const socialTabBarStyles = tv({
  slots: {
    root: 'mt-4 grid grid-cols-2 gap-2 rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_40%,transparent)] p-1',
  },
})

export const socialTabButtonStyles = tv({
  base: 'focus-visible:ring-ring inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-bold tracking-widest uppercase transition-all focus-visible:ring-2 focus-visible:outline-none',
  variants: {
    active: {
      false:
        'text-[color-mix(in_srgb,rgb(200,170,110)_60%,transparent)] hover:bg-[color-mix(in_srgb,rgb(200,170,110)_10%,transparent)] hover:text-[color-mix(in_srgb,rgb(200,170,110)_90%,transparent)]',
      true: 'border border-[color-mix(in_srgb,rgb(200,170,110)_40%,transparent)] bg-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)] text-[rgb(200,170,110)]',
    },
  },
})

export const socialTabIconStyles = tv({
  base: 'size-4',
})
export const socialUnreadBadgeStyles = tv({
  base: 'ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[rgb(200,170,110)] px-1.5 py-0.5 text-[0.65rem] leading-none font-bold text-[color-mix(in_srgb,rgb(10,20,40)_80%,transparent)]',
})

export const friendsListStyles = tv({
  slots: {
    chevron: 'h-4 w-4 transition-transform',
    emptyState:
      'rounded-xl border border-dashed border-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_30%,transparent)] p-5 text-center',
    emptyText: 'mt-2 text-sm text-[color-mix(in_srgb,rgb(200,170,110)_70%,transparent)]',
    emptyTitle: 'text-base font-bold tracking-widest text-[rgb(200,170,110)] uppercase',
    friendButton:
      'focus-visible:ring-ring flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:ring-2 focus-visible:outline-none',
    friendInfo: 'min-w-0 flex-1',
    friendList: 'space-y-2',
    friendName: 'text-foreground block truncate text-sm font-medium',
    friendRow: 'flex items-center gap-3 rounded-xl border px-2 py-2 transition-colors duration-150',
    friendStatus: 'mt-1 flex items-center gap-1.5 text-xs text-[color-mix(in_srgb,rgb(200,170,110)_70%,transparent)]',
    group:
      'rounded-xl border border-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_30%,transparent)]',
    groupButton:
      'focus-visible:ring-ring flex w-full items-center justify-between px-3 py-2 text-left focus-visible:ring-2 focus-visible:outline-none',
    groupContent: 'border-t border-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)] p-2',
    groupCount: 'inline-flex items-center gap-2 text-xs text-[color-mix(in_srgb,rgb(200,170,110)_50%,transparent)]',
    groupEmpty: 'px-2 py-3 text-sm text-[color-mix(in_srgb,rgb(200,170,110)_70%,transparent)]',
    groupTitle: 'text-xs font-bold tracking-widest text-[color-mix(in_srgb,rgb(200,170,110)_70%,transparent)] uppercase',
    inviteButton: 'h-11 min-w-11 px-2 text-xs sm:h-8 sm:min-w-0',
    root: 'space-y-3',
    sentInviteChip:
      'flex h-11 min-w-11 items-center justify-center rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_30%,transparent)] bg-[color-mix(in_srgb,rgb(200,170,110)_10%,transparent)] px-3 text-xs font-bold tracking-widest text-[rgb(200,170,110)] uppercase sm:h-8',
  },
})

export const friendsListFriendRowStyles = tv({
  base: 'flex items-center gap-3 rounded-xl border px-2 py-2 transition-colors duration-150',
  variants: {
    selected: {
      false:
        'border-transparent hover:border-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)] hover:bg-[color-mix(in_srgb,rgb(10,20,40)_40%,transparent)]',
      true: 'border-[color-mix(in_srgb,rgb(200,170,110)_30%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_50%,transparent)]',
    },
  },
})

export const friendsListInviteButtonStyles = tv({
  base: 'flex h-11 min-w-11 items-center justify-center rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_40%,transparent)] px-2 text-xs font-bold tracking-widest text-[color-mix(in_srgb,rgb(200,170,110)_60%,transparent)] uppercase transition-all hover:bg-[color-mix(in_srgb,rgb(200,170,110)_10%,transparent)] disabled:opacity-50 sm:h-8 sm:min-w-0',
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
      'focus-visible:ring-ring flex w-full items-center gap-3 rounded-xl border border-transparent px-2 py-2 text-left transition-colors duration-150 hover:border-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)] hover:bg-[color-mix(in_srgb,rgb(10,20,40)_40%,transparent)] focus-visible:ring-2 focus-visible:outline-none',
    conversationHeader: 'flex items-baseline justify-between gap-2',
    conversationInfo: 'min-w-0 flex-1',
    conversationPreview: 'mt-1 block truncate text-xs text-[color-mix(in_srgb,rgb(200,170,110)_70%,transparent)]',
    conversationTime:
      'shrink-0 text-[0.65rem] tracking-wide text-[color-mix(in_srgb,rgb(200,170,110)_70%,transparent)] uppercase',
    conversationTitle: 'text-foreground block truncate text-sm font-medium',
    emptyState:
      'rounded-xl border border-dashed border-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_30%,transparent)] p-5 text-center',
    emptyText: 'mt-2 text-sm text-[color-mix(in_srgb,rgb(200,170,110)_70%,transparent)]',
    emptyTitle: 'text-base font-bold tracking-widest text-[rgb(200,170,110)] uppercase',
    groupIcon:
      'flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_40%,transparent)] text-[color-mix(in_srgb,rgb(200,170,110)_70%,transparent)]',
    root: 'space-y-1',
  },
})

export const chatPanelStyles = tv({
  slots: {
    dateDivider:
      'flex items-center gap-3 py-1 text-[0.65rem] font-bold tracking-widest text-[color-mix(in_srgb,rgb(200,170,110)_70%,transparent)] uppercase',
    dateDividerLine: 'flex-1 border-t border-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)]',
    emptyState:
      'rounded-xl border border-dashed border-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_30%,transparent)] p-5 text-center text-sm text-[color-mix(in_srgb,rgb(200,170,110)_70%,transparent)]',
    form: 'flex gap-2 border-t border-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)] p-3',
    formInput:
      'text-foreground rounded-full border-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_40%,transparent)] placeholder:text-[color-mix(in_srgb,rgb(200,170,110)_50%,transparent)]',
    header: 'border-b border-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)] px-4 py-4',
    headerBackButton:
      'focus-visible:ring-ring -ml-1 flex size-7 shrink-0 items-center justify-center rounded-full text-[color-mix(in_srgb,rgb(200,170,110)_70%,transparent)] hover:text-[rgb(200,170,110)] focus-visible:ring-2 focus-visible:outline-none',
    headerEmpty: 'text-sm text-[color-mix(in_srgb,rgb(200,170,110)_70%,transparent)]',
    headerGroupIcon:
      'flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_40%,transparent)] text-[color-mix(in_srgb,rgb(200,170,110)_70%,transparent)]',
    headerStatus: 'mt-1 flex items-center gap-1.5 text-xs text-[color-mix(in_srgb,rgb(200,170,110)_70%,transparent)]',
    headerTitle: 'text-foreground truncate text-sm font-semibold',
    messageBubble: 'max-w-[85%] rounded-2xl border px-3 py-2 text-sm',
    messageSender:
      'mb-0.5 block text-xs font-bold tracking-widest text-[color-mix(in_srgb,rgb(200,170,110)_70%,transparent)] uppercase',
    messageText: 'break-words',
    root: 'flex h-full min-h-0 flex-col overflow-hidden bg-[color-mix(in_srgb,rgb(10,20,40)_60%,transparent)]',
    timestamp: 'mt-1 block text-[0.65rem] tracking-wide text-[color-mix(in_srgb,rgb(200,170,110)_70%,transparent)] uppercase',
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
  base: 'max-w-[85%] rounded-2xl border px-3 py-2 text-sm',
  variants: {
    outgoing: {
      false:
        'text-foreground border-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_40%,transparent)]',
      true: 'border-[color-mix(in_srgb,rgb(200,170,110)_60%,transparent)] bg-gradient-to-r from-[color-mix(in_srgb,rgb(200,170,110)_20%,transparent)] to-[color-mix(in_srgb,rgb(200,170,110)_5%,transparent)] text-[rgb(200,170,110)]',
    },
  },
})
