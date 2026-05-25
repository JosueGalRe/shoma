import type { ChampionSkin } from '@/core/http/ddragon-client'
import type { PerkPage } from '@/core/lcu/parsers/perks'
import type { RuneId as RuneIdType } from '@/core/types/branded'
import type { SwiftplayOption } from '@/features/swiftplay/swiftplay-store'
import type { LcuQuickplayPlayerSlotsBody } from '@shoma/protocol-contract'

const positionPreferenceByValue: Record<string, string> = {
  bottom: 'BOTTOM',
  fill: 'FILL',
  jungle: 'JUNGLE',
  middle: 'MIDDLE',
  top: 'TOP',
  utility: 'UTILITY',
}

function findSelectedSkinId(skins: ChampionSkin[], skinNum: number | null): number | null {
  if (skinNum === null) {
    return null
  }

  const skinId = skins.find((skin) => {
    return skin.num === skinNum
  })?.id

  return skinId ? Number(skinId) : null
}

function findPerkPageForRune(perkPages: PerkPage[], runeId: RuneIdType | null): PerkPage | null {
  if (runeId === null) {
    return null
  }

  return (
    perkPages.find((page) => {
      return page.primaryStyleId === runeId
    }) ?? null
  )
}

function buildPerksString(perkPage: PerkPage): string {
  return JSON.stringify({
    perkIds: perkPage.selectedPerkIds,
    perkStyle: perkPage.primaryStyleId,
    perkSubStyle: perkPage.subStyleId,
  })
}

export function buildPlayerSlotsBody(
  options: [SwiftplayOption, SwiftplayOption],
  skinsByOption: [ChampionSkin[], ChampionSkin[]],
  perkPages: PerkPage[],
): LcuQuickplayPlayerSlotsBody | null {
  const slots: LcuQuickplayPlayerSlotsBody = []

  for (let index = 0; index < options.length; index += 1) {
    const option = options[index]
    const positionPreference = option.position ? positionPreferenceByValue[option.position] : null
    const skinId = findSelectedSkinId(skinsByOption[index], option.skinId)
    const perkPage = findPerkPageForRune(perkPages, option.runeId)

    if (
      option.championId === null ||
      positionPreference === null ||
      skinId === null ||
      option.spell1Id === null ||
      option.spell2Id === null ||
      perkPage === null
    ) {
      return null
    }

    slots.push({
      championId: option.championId,
      perks: buildPerksString(perkPage),
      positionPreference,
      skinId,
      spell1: option.spell1Id,
      spell2: option.spell2Id,
    })
  }

  return slots
}
