const en = {
  common: {
    cancel: 'Cancel',
    close: 'Close',
    connect: 'Connect',
    decline: 'Decline',
    invite: 'Invite',
    leave: 'Leave',
    ok: 'OK',
    retry: 'Retry',
    save: 'Save',
  },
  connection: {
    title: 'Connect to Mimic',
    subtitle: 'Enter your 6-digit code to start a secure session.',
    codePlaceholder: '000000',
    invalidCode: 'The connection code must be 6 digits.',
    sessionExpired: 'Your previous session expired. Enter a new code.',
  },
  lobby: {
    title: 'Lobby',
    create: 'Create lobby',
    leaveConfirm: 'Leave the lobby?',
    noData: 'No lobby data available.',
  },
  queue: {
    title: 'Queue',
    findMatch: 'Find match',
    leave: 'Leave queue',
    searching: 'Searching',
    notInQueue: 'You are not in a queue.',
  },
  readyCheck: {
    title: 'Ready check',
    accept: 'Accept match',
    decline: 'Decline match',
    none: 'No active ready check.',
  },
  invites: {
    title: 'Invites',
    none: 'No pending invites.',
    open: 'Open invites',
  },
  champSelect: {
    title: 'Champ select',
    phase: 'Phase',
    timeLeft: 'Time left',
    yourTurn: 'Your turn',
    noSession: 'No active champ select session.',
  },
  errors: {
    generic: 'Something went wrong.',
    network: 'Network error. Try again.',
    unavailable: 'This feature is currently unavailable.',
  },
} as const

export default en
