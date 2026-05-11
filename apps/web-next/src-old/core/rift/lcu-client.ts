import {
  LcuHttpMethod,
  LcuPaths,
  type LcuChampSelectActionPatchBody,
  type LcuChampSelectMySelectionPatchBody,
  type LcuHttpMethodValue,
  type LcuLobbyInvitationBody,
  type LcuLobbyPositionPreferencesBody,
  type LcuLobbyQueueBody,
  type LcuObserver,
  type LcuPerksPageCreateBody,
  type LcuPerksPageUpdateBody,
  type LcuResult,
} from '@mimic/protocol-contract'

export type LcuTransportLike = {
  request: (path: string, method?: LcuHttpMethodValue, body?: string) => Promise<LcuResult>
  observe: (path: string, handler: (result: LcuResult) => void | Promise<void>) => Promise<void>
  unobserve: (path: string) => Promise<void>
}

function serializeBody(body: unknown): string | undefined {
  if (body === undefined) {
    return undefined
  }

  if (typeof body === 'string') {
    return body
  }

  return JSON.stringify(body)
}

export function createLcuClient(transport: LcuTransportLike) {
  function request<TContent = unknown>(path: string, method: LcuHttpMethodValue = LcuHttpMethod.GET, body?: unknown): Promise<LcuResult<TContent>> {
    return transport.request(path, method, serializeBody(body)) as Promise<LcuResult<TContent>>
  }

  function observe(path: string, handler: LcuObserver): Promise<void> {
    return transport.observe(path, handler)
  }

  return {
    observe,
    unobserve(path: string) {
      return transport.unobserve(path)
    },
    assets: {
      getSummonerSpells() {
        return request<unknown[]>(LcuPaths.assetServing.summonerSpells)
      },
    },
    champions: {
      getInventorySkinsMinimal(summonerId: number) {
        return request<unknown[]>(LcuPaths.champions.inventorySkinsMinimal(summonerId))
      },
    },
    champSelect: {
      observeSession(handler: LcuObserver) {
        return observe(LcuPaths.champSelect.session, handler)
      },
      getSession() {
        return request(LcuPaths.champSelect.session)
      },
      getSelectableChampionIds(actionType: string) {
        const path = actionType === 'ban' ? LcuPaths.champSelect.bannableChampionIds : LcuPaths.champSelect.pickableChampionIds
        return request<unknown[]>(path)
      },
      patchMySelection(body: LcuChampSelectMySelectionPatchBody) {
        return request(LcuPaths.champSelect.mySelection, LcuHttpMethod.PATCH, body)
      },
      patchAction(actionId: number, body: LcuChampSelectActionPatchBody) {
        return request(LcuPaths.champSelect.action(actionId), LcuHttpMethod.PATCH, body)
      },
      reroll() {
        return request(LcuPaths.champSelect.mySelectionReroll, LcuHttpMethod.POST)
      },
      benchSwap(championId: number) {
        return request(LcuPaths.champSelect.benchSwap(championId), LcuHttpMethod.POST)
      },
    },
    gameflow: {
      getSession() {
        return request(LcuPaths.gameflow.session)
      },
    },
    gameQueues: {
      getQueues() {
        return request<unknown[]>(LcuPaths.gameQueues.queues)
      },
      getQueue(queueId: number) {
        return request(LcuPaths.gameQueues.queue(queueId))
      },
    },
    lobby: {
      observeLobby(handler: LcuObserver) {
        return observe(LcuPaths.lobby.lobby, handler)
      },
      observeReceivedInvitations(handler: LcuObserver) {
        return observe(LcuPaths.lobby.receivedInvitations, handler)
      },
      getLobby() {
        return request(LcuPaths.lobby.lobby)
      },
      createLobby(body: LcuLobbyQueueBody) {
        return request(LcuPaths.lobby.lobby, LcuHttpMethod.POST, body)
      },
      deleteLobby() {
        return request(LcuPaths.lobby.lobby, LcuHttpMethod.DELETE)
      },
      joinQueue() {
        return request(LcuPaths.lobby.matchmakingSearch, LcuHttpMethod.POST)
      },
      leaveQueue() {
        return request(LcuPaths.lobby.matchmakingSearch, LcuHttpMethod.DELETE)
      },
      inviteSummoners(body: LcuLobbyInvitationBody[]) {
        return request(LcuPaths.lobby.invitations, LcuHttpMethod.POST, body)
      },
      acceptReceivedInvitation(invitationId: string) {
        return request(LcuPaths.lobby.receivedInvitationAccept(invitationId), LcuHttpMethod.POST)
      },
      declineReceivedInvitation(invitationId: string) {
        return request(LcuPaths.lobby.receivedInvitationDecline(invitationId), LcuHttpMethod.POST)
      },
      promoteMember(summonerId: number) {
        return request(LcuPaths.lobby.memberPromote(summonerId), LcuHttpMethod.POST)
      },
      kickMember(summonerId: number) {
        return request(LcuPaths.lobby.memberKick(summonerId), LcuHttpMethod.POST)
      },
      grantMemberInvite(summonerId: number) {
        return request(LcuPaths.lobby.memberGrantInvite(summonerId), LcuHttpMethod.POST)
      },
      revokeMemberInvite(summonerId: number) {
        return request(LcuPaths.lobby.memberRevokeInvite(summonerId), LcuHttpMethod.POST)
      },
      updateLocalMemberPositionPreferences(body: LcuLobbyPositionPreferencesBody) {
        return request(LcuPaths.lobby.localMemberPositionPreferences, LcuHttpMethod.PUT, body)
      },
    },
    maps: {
      getMap(mapId: number) {
        return request(LcuPaths.maps.map(mapId))
      },
    },
    matchmaking: {
      observeSearch(handler: LcuObserver) {
        return observe(LcuPaths.matchmaking.search, handler)
      },
      observeReadyCheck(handler: LcuObserver) {
        return observe(LcuPaths.matchmaking.readyCheck, handler)
      },
      getSearch() {
        return request(LcuPaths.matchmaking.search)
      },
      getReadyCheck() {
        return request(LcuPaths.matchmaking.readyCheck)
      },
      acceptReadyCheck() {
        return request(LcuPaths.matchmaking.readyCheckAccept, LcuHttpMethod.POST)
      },
      declineReadyCheck() {
        return request(LcuPaths.matchmaking.readyCheckDecline, LcuHttpMethod.POST)
      },
    },
    perks: {
      getStyles() {
        return request<unknown[]>(LcuPaths.perks.styles)
      },
      getPages() {
        return request(LcuPaths.perks.pages)
      },
      createPage(body: LcuPerksPageCreateBody) {
        return request(LcuPaths.perks.pages, LcuHttpMethod.POST, body)
      },
      getCurrentPage() {
        return request(LcuPaths.perks.currentPage)
      },
      selectCurrentPage(pageId: number) {
        return request(LcuPaths.perks.currentPage, LcuHttpMethod.PUT, String(pageId))
      },
      getPage(pageId: number) {
        return request(LcuPaths.perks.page(pageId))
      },
      updatePage(pageId: number, body: LcuPerksPageUpdateBody) {
        return request(LcuPaths.perks.page(pageId), LcuHttpMethod.PUT, body)
      },
      deletePage(pageId: number) {
        return request(LcuPaths.perks.page(pageId), LcuHttpMethod.DELETE)
      },
    },
    platformConfig: {
      getNamespaceKey(namespace: string, key: string) {
        return request(LcuPaths.platformConfig.namespaceKey(namespace, key))
      },
    },
    suggestedPlayers: {
      getSuggestedPlayers() {
        return request(LcuPaths.suggestedPlayers.suggestedPlayers)
      },
    },
    summoner: {
      getCurrentSummonerRerollPoints() {
        return request(LcuPaths.summoner.currentSummonerRerollPoints)
      },
      getSummoner(summonerId: number) {
        return request(LcuPaths.summoner.summoner(summonerId))
      },
      getSummonerByName(name: string) {
        return request(LcuPaths.summoner.summonersByName(name))
      },
    },
  }
}

export type LcuClient = ReturnType<typeof createLcuClient>
