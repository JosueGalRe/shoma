import { LcuHttpMethod, LcuPaths } from '@shoma/protocol-contract'

import type { ChampSelectActionPatch } from './champ-select-actions'
import type { LcuTransport } from '@/core/relay/lcu-transport'
import type { ChampionId as ChampionIdType, SpellId } from '@/core/types/branded'

function isSuccessfulStatus(status: number): boolean {
  return status >= 200 && status < 300
}

export async function patchChampSelectAction(
  transport: LcuTransport,
  actionId: number,
  patch: ChampSelectActionPatch,
): Promise<boolean> {
  const result = await transport.request(LcuPaths.champSelect.action(actionId), LcuHttpMethod.PATCH, patch)

  return isSuccessfulStatus(result.status)
}

export async function swapBenchChampion(transport: LcuTransport, championId: ChampionIdType): Promise<boolean> {
  const result = await transport.request(LcuPaths.champSelect.benchSwap(championId), LcuHttpMethod.POST)

  return isSuccessfulStatus(result.status)
}

export interface MySelectionPatch {
  selectedSkinId?: number
  spell1Id?: SpellId
  spell2Id?: SpellId
  wardSkinId?: number
}

export async function patchMySelection(transport: LcuTransport, patch: MySelectionPatch): Promise<boolean> {
  const result = await transport.request(LcuPaths.champSelect.mySelection, LcuHttpMethod.PATCH, patch)

  return isSuccessfulStatus(result.status)
}
