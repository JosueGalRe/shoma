export const lobbyStyles = {
  ownerCard:
    'relative flex w-full flex-col items-center gap-3 rounded-xl border border-[color-mix(in_srgb,rgb(200,170,110)_20%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_40%,transparent)] p-5 backdrop-blur-md transition-all hover:border-[color-mix(in_srgb,rgb(200,170,110)_40%,transparent)] hover:bg-[color-mix(in_srgb,rgb(10,20,40)_50%,transparent)] hover:backdrop-blur-lg disabled:cursor-not-allowed disabled:opacity-60',
  ownerPencilIcon:
    'absolute top-3 right-3 flex size-7 items-center justify-center rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_30%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_80%,transparent)] text-[color-mix(in_srgb,rgb(200,170,110)_70%,transparent)] backdrop-blur-md',
  ownerAvatarContainer:
    'size-20 overflow-hidden rounded-full border-2 border-[color-mix(in_srgb,rgb(200,170,110)_60%,transparent)] shadow-[0_0_25px_color-mix(in_srgb,rgb(200,170,110)_30%,transparent)]',
  ownerCrownIcon:
    'absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_50%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_80%,transparent)] backdrop-blur-md',
  memberCardContainer:
    'flex flex-col items-center gap-2 rounded-xl border border-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_30%,transparent)] p-3 backdrop-blur-md transition-all hover:bg-[color-mix(in_srgb,rgb(10,20,40)_40%,transparent)] hover:backdrop-blur-lg',
  memberCardSearching: 'animate-[member-glow_2s_ease-in-out_infinite]',
  memberRuneIcon:
    'rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_30%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_60%,transparent)] p-1 backdrop-blur-md',
  memberAvatarContainer:
    'size-14 overflow-hidden rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_40%,transparent)] shadow-[0_0_10px_color-mix(in_srgb,rgb(200,170,110)_15%,transparent)]',
  inviteButton:
    'mt-3 flex w-full items-center justify-center gap-3 rounded-xl border border-dashed border-[color-mix(in_srgb,rgb(200,170,110)_30%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_20%,transparent)] p-4 text-[color-mix(in_srgb,rgb(200,170,110)_60%,transparent)] backdrop-blur-md transition-all hover:border-[color-mix(in_srgb,rgb(200,170,110)_60%,transparent)] hover:bg-[color-mix(in_srgb,rgb(10,20,40)_40%,transparent)] hover:text-[rgb(200,170,110)] hover:backdrop-blur-lg',
  inviteBadge:
    'absolute -top-1 -right-2 flex size-4 items-center justify-center rounded-full bg-[rgb(200,170,110)] text-[10px] font-bold text-[color-mix(in_srgb,rgb(10,20,40)_80%,transparent)]',
  queueWave:
    'pointer-events-none absolute inset-0 animate-[queue-wave_2s_ease-out_infinite] rounded-2xl border-2 border-[color-mix(in_srgb,rgb(200,170,110)_50%,transparent)] blur-[2px] transition-opacity duration-1000',
  queueContainer:
    'relative flex flex-col items-center gap-4 rounded-2xl border border-[color-mix(in_srgb,rgb(200,170,110)_30%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_60%,transparent)] p-5 backdrop-blur-md',
  queueSearchLabel:
    'text-xs font-bold tracking-[0.25em] text-[color-mix(in_srgb,rgb(200,170,110)_90%,transparent)] uppercase tabular-nums',
  queueStatusDotSearching: 'animate-pulse bg-[rgb(200,170,110)] shadow-[0_0_8px_rgb(200,170,110)]',
  queueStatusDotIdle: 'bg-[color-mix(in_srgb,rgb(200,170,110)_30%,transparent)]',
  cancelButton:
    'w-full rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_40%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_60%,transparent)] px-6 py-3 text-xs font-bold tracking-widest text-[color-mix(in_srgb,rgb(200,170,110)_60%,transparent)] uppercase backdrop-blur-md transition-all hover:border-[color-mix(in_srgb,rgb(200,170,110)_60%,transparent)] hover:bg-[color-mix(in_srgb,rgb(200,170,110)_10%,transparent)] hover:text-[color-mix(in_srgb,rgb(200,170,110)_90%,transparent)] hover:backdrop-blur-lg active:scale-[0.98]',
  findMatchButton:
    'flex-1 rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_60%,transparent)] bg-gradient-to-r from-[color-mix(in_srgb,rgb(200,170,110)_20%,transparent)] to-[color-mix(in_srgb,rgb(200,170,110)_5%,transparent)] px-6 py-3 text-xs font-bold tracking-widest text-[rgb(200,170,110)] uppercase backdrop-blur-md transition-all hover:from-[color-mix(in_srgb,rgb(200,170,110)_30%,transparent)] hover:to-[color-mix(in_srgb,rgb(200,170,110)_10%,transparent)] hover:shadow-[0_0_25px_color-mix(in_srgb,rgb(200,170,110)_25%,transparent)] hover:backdrop-blur-lg active:scale-[0.98]',
  leaveButton:
    'flex-1 rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_40%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_60%,transparent)] px-6 py-3 text-xs font-bold tracking-widest text-[color-mix(in_srgb,rgb(200,170,110)_60%,transparent)] uppercase backdrop-blur-md transition-all hover:border-[color-mix(in_srgb,rgb(200,170,110)_60%,transparent)] hover:bg-[color-mix(in_srgb,rgb(200,170,110)_10%,transparent)] hover:text-[color-mix(in_srgb,rgb(200,170,110)_90%,transparent)] hover:backdrop-blur-lg disabled:cursor-not-allowed disabled:opacity-50',
  backgroundEffects: {
    container: 'pointer-events-none absolute inset-0 overflow-hidden',
    pattern: 'absolute inset-0 opacity-5',
    particle: 'absolute animate-[drift-around_30s_ease-in-out_infinite] opacity-5',
    glow: 'absolute bottom-[15%] left-1/2 h-64 w-64 -translate-x-1/2 rounded-full transition-all duration-1000',
  },
  inGameScreen: {
    matchInfoCard:
      'flex items-center justify-between rounded-2xl border border-[color-mix(in_srgb,rgb(200,170,110)_30%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_60%,transparent)] p-5 backdrop-blur-md',
    matchInfoLabel: 'text-xs font-bold tracking-widest text-[color-mix(in_srgb,rgb(200,170,110)_70%,transparent)] uppercase',
    matchInfoIconContainer:
      'flex size-12 items-center justify-center rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_40%,transparent)] bg-[color-mix(in_srgb,rgb(200,170,110)_10%,transparent)]',
    timerCard:
      'flex flex-col items-center justify-center gap-2 rounded-2xl border border-[color-mix(in_srgb,rgb(200,170,110)_20%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_40%,transparent)] py-12 backdrop-blur-md',
    timerText:
      'text-6xl font-bold tracking-tight text-[rgb(200,170,110)] drop-shadow-[0_0_15px_color-mix(in_srgb,rgb(200,170,110)_40%,transparent)] tabular-nums',
    liveBadge: 'mt-4 flex items-center gap-2 rounded-full bg-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)] px-4 py-1.5',
    statusCard:
      'flex items-center justify-center gap-2 rounded-xl border border-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_40%,transparent)] p-4 backdrop-blur-md',
  },
}
