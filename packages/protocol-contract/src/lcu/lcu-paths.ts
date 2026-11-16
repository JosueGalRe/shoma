export const LcuPaths = {
  assetServing: {
    regalia: '/lol-game-data/assets/v1/regalia.json',
    summonerSpells: '/lol-game-data/assets/v1/summoner-spells.json',
  },
  challenges: {
    playerSummary(puuid: string) {
      return `/lol-challenges/v1/summary-player-data/player/${encodeURIComponent(puuid)}`
    },
  },
  championMastery: {
    localPlayer: '/lol-champion-mastery/v1/local-player/champion-mastery',
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
    ongoingChampionSwap: '/lol-champ-select/v1/ongoing-champion-swap',
    pickableChampionIds: '/lol-champ-select/v1/pickable-champion-ids',
    pickableSkinIds: '/lol-champ-select/v1/pickable-skin-ids',
    session: '/lol-champ-select/v1/session',
    subsetChampionList: '/lol-lobby-team-builder/champ-select/v1/subset-champion-list',
  },
  champions: {
    championSkins(summonerId: number, championId: number) {
      return `/lol-champions/v1/inventories/${summonerId}/champions/${championId}/skins`
    },
    inventorySkinsMinimal(summonerId: number) {
      return `/lol-champions/v1/inventories/${summonerId}/skins-minimal`
    },
    queueChampionsMinimal(summonerId: number, queueId: number) {
      return `/lol-champions/v1/inventories/${summonerId}/${queueId}/champions-minimal-per-queue`
    },
  },
  clash: {
    tournaments: '/lol-clash/v1/all-tournaments',
    visible: '/lol-clash/v1/visible',
  },
  collections: {
    wardSkins(summonerId: number) {
      return `/lol-collections/v1/inventories/${summonerId}/ward-skins`
    },
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
  loadouts: {
    account: '/lol-loadouts/v4/loadouts/scope/account',
    loadout(id: string) {
      return `/lol-loadouts/v4/loadouts/${id}`
    },
  },
  lobby: {
    agsActivityId: '/lol-lobby/v2/ags/agsActivityId',
    agsJoinCode(activityId: string) {
      return `/lol-lobby/v2/ags/${encodeURIComponent(activityId)}/joinCode`
    },
    invitations: '/lol-lobby/v2/lobby/invitations',
    lobby: '/lol-lobby/v2/lobby',
    localMemberPlayerSlots: '/lol-lobby/v1/lobby/members/localMember/player-slots',
    quickplayMemberData: '/lol-lobby/v2/lobby/quickplayMemberData',
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
    maps: '/lol-maps/v2/maps',
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
    perks: '/lol-perks/v1/perks',
    quickPlaySelection(championId: number, position: string) {
      return `/lol-perks/v1/quick-play-selections/champion/${championId}/position/${encodeURIComponent(position)}`
    },
    recommendedPages(championId: number, position: string, mapId: number) {
      return `/lol-perks/v1/recommended-pages/champion/${championId}/position/${encodeURIComponent(position)}/map/${mapId}`
    },
    styles: '/lol-perks/v1/styles',
  },
  platformConfig: {
    namespaceKey(namespace: string, key: string) {
      return `/lol-platform-config/v1/namespaces/${encodeURIComponent(namespace)}/${encodeURIComponent(key)}`
    },
  },
  settings: {
    // The client's champ select account settings: the last skin and spells per champion
    champSelect: '/lol-settings/v1/account/champ-select',
    // Its champ select preferences: the favorite champions per position
    champSelectPreferences: '/lol-settings/v2/account/LCUPreferences/lol-champ-select',
  },
  social: {
    // The conversation on screen, { id }: the LCU doesn't count it unread. DELETE when none is
    activeConversation: '/lol-chat/v1/conversations/active',
    conversationMessages(conversationId: string) {
      return `/lol-chat/v1/conversations/${conversationId}/messages`
    },
    conversations: '/lol-chat/v1/conversations',
    friendGroups: '/lol-chat/v1/friend-groups',
    friendRequests: '/lol-chat/v2/friend-requests',
    friends: '/lol-chat/v1/friends',
    me: '/lol-chat/v1/me',
    // The friend list's order and grouping, written whole
    settings: '/lol-chat/v1/settings',
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
