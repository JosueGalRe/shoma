export const LcuPaths = {
  assetServing: {
    summonerSpells: '/lol-game-data/assets/v1/summoner-spells.json',
  },
  champSelect: {
    action(actionId: number) {
      return `/lol-champ-select/v1/session/actions/${actionId}`
    },
    bannableChampionIds: '/lol-champ-select/v1/bannable-champion-ids',
    benchSwap(championId: number) {
      return `/lol-champ-select/v1/session/bench/swap/${championId}`
    },
    mySelection: '/lol-champ-select/v1/session/my-selection',
    mySelectionReroll: '/lol-champ-select/v1/session/my-selection/reroll',
    pickableChampionIds: '/lol-champ-select/v1/pickable-champion-ids',
    session: '/lol-champ-select/v1/session',
  },
  champions: {
    inventorySkinsMinimal(summonerId: number) {
      return `/lol-champions/v1/inventories/${summonerId}/skins-minimal`
    },
  },
  clash: {
    tournaments: '/lol-clash/v1/tournaments',
    visible: '/lol-clash/v1/visible',
  },
  gameQueues: {
    queue(queueId: number) {
      return `/lol-game-queues/v1/queues/${queueId}`
    },
    queues: '/lol-game-queues/v1/queues',
  },
  gameflow: {
    phase: '/lol-gameflow/v1/gameflow-phase',
    session: '/lol-gameflow/v1/session',
  },
  lobby: {
    agsActivityId: '/lol-lobby/v2/ags/agsActivityId',
    agsJoinCode(activityId: string) {
      return `/lol-lobby/v2/ags/${encodeURIComponent(activityId)}/joinCode`
    },
    invitations: '/lol-lobby/v2/lobby/invitations',
    lobby: '/lol-lobby/v2/lobby',
    localMemberPlayerSlots: '/lol-lobby/v1/lobby/members/localMember/player-slots',
    localMemberPositionPreferences: '/lol-lobby/v2/lobby/members/localMember/position-preferences',
    matchmakingSearch: '/lol-lobby/v2/lobby/matchmaking/search',
    memberGrantInvite(summonerId: number) {
      return `/lol-lobby/v2/lobby/members/${summonerId}/grant-invite`
    },
    memberKick(summonerId: number) {
      return `/lol-lobby/v2/lobby/members/${summonerId}/kick`
    },
    memberPromote(summonerId: number) {
      return `/lol-lobby/v2/lobby/members/${summonerId}/promote`
    },
    memberRevokeInvite(summonerId: number) {
      return `/lol-lobby/v2/lobby/members/${summonerId}/revoke-invite`
    },
    partyType: '/lol-lobby/v2/lobby/partyType',
    receivedInvitationAccept(invitationId: string) {
      return `/lol-lobby/v2/received-invitations/${encodeURIComponent(invitationId)}/accept`
    },
    receivedInvitationDecline(invitationId: string) {
      return `/lol-lobby/v2/received-invitations/${encodeURIComponent(invitationId)}/decline`
    },
    receivedInvitations: '/lol-lobby/v2/received-invitations',
  },
  maps: {
    map(mapId: number) {
      return `/lol-maps/v1/map/${mapId}`
    },
  },
  matchHistory: {
    recentPlayers: '/lol-match-history/v1/recently-played-summoners',
  },
  matchmaking: {
    readyCheck: '/lol-matchmaking/v1/ready-check',
    readyCheckAccept: '/lol-matchmaking/v1/ready-check/accept',
    readyCheckDecline: '/lol-matchmaking/v1/ready-check/decline',
    search: '/lol-matchmaking/v1/search',
  },
  perks: {
    currentPage: '/lol-perks/v1/currentpage',
    page(pageId: number) {
      return `/lol-perks/v1/pages/${pageId}`
    },
    pages: '/lol-perks/v1/pages',
    styles: '/lol-perks/v1/styles',
  },
  platformConfig: {
    namespaceKey(namespace: string, key: string) {
      return `/lol-platform-config/v1/namespaces/${encodeURIComponent(namespace)}/${encodeURIComponent(key)}`
    },
  },
  social: {
    conversationMessages(conversationId: string) {
      return `/lol-chat/v1/conversations/${conversationId}/messages`
    },
    conversations: '/lol-chat/v1/conversations',
    friendGroups: '/lol-chat/v1/friend-groups',
    friends: '/lol-chat/v1/friends',
    me: '/lol-chat/v1/me',
  },
  suggestedPlayers: {
    suggestedPlayers: '/lol-suggested-players/v1/suggested-players',
  },
  summoner: {
    currentSummoner: '/lol-summoner/v1/current-summoner',
    currentSummonerRerollPoints: '/lol-summoner/v1/current-summoner/rerollPoints',
    summoner(summonerId: number) {
      return `/lol-summoner/v1/summoners/${summonerId}`
    },
    summonersByName(name: string) {
      return `/lol-summoner/v1/summoners?name=${encodeURIComponent(name)}`
    },
  },
} as const

export const LcuPathPatterns = {
  gameQueue: /^\/lol-game-queues\/v1\/queues\/(?<queueId>\d+)$/,
  map: /^\/lol-maps\/v1\/map\/(?<mapId>\d+)$/,
} as const

export type LcuPath = string
