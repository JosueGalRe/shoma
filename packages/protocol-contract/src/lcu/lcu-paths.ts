export const LcuPaths = {
  assetServing: {
    summonerSpells: '/lol-game-data/assets/v1/summoner-spells.json',
  },
  champions: {
    inventorySkinsMinimal(summonerId: number) {
      return `/lol-champions/v1/inventories/${summonerId}/skins-minimal`
    },
  },
  champSelect: {
    session: '/lol-champ-select/v1/session',
    mySelection: '/lol-champ-select/v1/session/my-selection',
    mySelectionReroll: '/lol-champ-select/v1/session/my-selection/reroll',
    pickableChampionIds: '/lol-champ-select/v1/pickable-champion-ids',
    bannableChampionIds: '/lol-champ-select/v1/bannable-champion-ids',
    action(actionId: number) {
      return `/lol-champ-select/v1/session/actions/${actionId}`
    },
    benchSwap(championId: number) {
      return `/lol-champ-select/v1/session/bench/swap/${championId}`
    },
  },
  gameflow: {
    phase: '/lol-gameflow/v1/gameflow-phase',
    session: '/lol-gameflow/v1/session',
  },
  gameQueues: {
    queues: '/lol-game-queues/v1/queues',
    queue(queueId: number) {
      return `/lol-game-queues/v1/queues/${queueId}`
    },
  },
  lobby: {
    lobby: '/lol-lobby/v2/lobby',
    matchmakingSearch: '/lol-lobby/v2/lobby/matchmaking/search',
    invitations: '/lol-lobby/v2/lobby/invitations',
    localMemberPlayerSlots: '/lol-lobby/v1/lobby/members/localMember/player-slots',
    receivedInvitations: '/lol-lobby/v2/received-invitations',
    receivedInvitationAccept(invitationId: string) {
      return `/lol-lobby/v2/received-invitations/${encodeURIComponent(invitationId)}/accept`
    },
    receivedInvitationDecline(invitationId: string) {
      return `/lol-lobby/v2/received-invitations/${encodeURIComponent(invitationId)}/decline`
    },
    memberPromote(summonerId: number) {
      return `/lol-lobby/v2/lobby/members/${summonerId}/promote`
    },
    memberKick(summonerId: number) {
      return `/lol-lobby/v2/lobby/members/${summonerId}/kick`
    },
    memberGrantInvite(summonerId: number) {
      return `/lol-lobby/v2/lobby/members/${summonerId}/grant-invite`
    },
    memberRevokeInvite(summonerId: number) {
      return `/lol-lobby/v2/lobby/members/${summonerId}/revoke-invite`
    },
    localMemberPositionPreferences: '/lol-lobby/v2/lobby/members/localMember/position-preferences',
  },
  maps: {
    map(mapId: number) {
      return `/lol-maps/v1/map/${mapId}`
    },
  },
  matchmaking: {
    search: '/lol-matchmaking/v1/search',
    readyCheck: '/lol-matchmaking/v1/ready-check',
    readyCheckAccept: '/lol-matchmaking/v1/ready-check/accept',
    readyCheckDecline: '/lol-matchmaking/v1/ready-check/decline',
  },
  perks: {
    styles: '/lol-perks/v1/styles',
    pages: '/lol-perks/v1/pages',
    currentPage: '/lol-perks/v1/currentpage',
    page(pageId: number) {
      return `/lol-perks/v1/pages/${pageId}`
    },
  },
  platformConfig: {
    namespaceKey(namespace: string, key: string) {
      return `/lol-platform-config/v1/namespaces/${encodeURIComponent(namespace)}/${encodeURIComponent(key)}`
    },
  },
  suggestedPlayers: {
    suggestedPlayers: '/lol-suggested-players/v1/suggested-players',
  },
  social: {
    friendGroups: '/lol-chat/v1/friend-groups',
    friends: '/lol-chat/v1/friends',
    me: '/lol-chat/v1/me',
    conversations: '/lol-chat/v1/conversations',
    conversationMessages(conversationId: string) {
      return `/lol-chat/v1/conversations/${encodeURIComponent(conversationId)}/messages`
    },
  },
  summoner: {
    currentSummoner: '/lol-summoner/v1/current-summoner',
    currentSummonerRerollPoints: '/lol-summoner/v1/current-summoner/rerollPoints',
    summonersByName(name: string) {
      return `/lol-summoner/v1/summoners?name=${encodeURIComponent(name)}`
    },
    summoner(summonerId: number) {
      return `/lol-summoner/v1/summoners/${summonerId}`
    },
  },
} as const

export const LcuPathPatterns = {
  gameQueue: /^\/lol-game-queues\/v1\/queues\/(\d+)$/,
  map: /^\/lol-maps\/v1\/map\/(\d+)$/,
} as const

export type LcuPath = string
