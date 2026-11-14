import type { PerkStyle } from '@/core/lcu/parsers/perks'

// A rune page being edited. Ids are 0 where nothing is picked yet
export interface RunePageDraft {
  primaryStyleId: number
  // The keystone and the three rows under it
  primary: number[]
  shards: number[]
  subStyleId: number
  // Up to two, from different rows of the sub style, in the order they were picked
  secondary: number[]
}

interface PageLike {
  primaryStyleId: number
  selectedPerkIds: readonly number[]
  subStyleId: number
}

function rowsOf(style: PerkStyle | undefined, types: readonly string[]): number[][] {
  return (style?.slots ?? []).flatMap(({ perks, type }) => {
    return types.includes(type) ? [perks] : []
  })
}

// The keystone row and the three under it
export function getPrimaryRows(style: PerkStyle | undefined): number[][] {
  return rowsOf(style, ['kKeyStone', 'kMixedRegularSplashable'])
}

export function getSecondaryRows(style: PerkStyle | undefined): number[][] {
  return rowsOf(style, ['kMixedRegularSplashable'])
}

export function getShardRows(style: PerkStyle | undefined): number[][] {
  return rowsOf(style, ['kStatMod'])
}

function findStyle(styles: readonly PerkStyle[], styleId: number): PerkStyle | undefined {
  return styles.find(({ id }) => {
    return id === styleId
  })
}

function findRow(rows: readonly number[][], perkId: number): number {
  return rows.findIndex((row) => {
    return row.includes(perkId)
  })
}

export function toRunePageDraft(page: PageLike, styles: readonly PerkStyle[]): RunePageDraft {
  const primaryStyle = findStyle(styles, page.primaryStyleId)
  const shardRows = getShardRows(primaryStyle)
  // Shard rows share perks (Adaptive Force is in two), so shards are read by position from the end of the page
  const shardIds = page.selectedPerkIds.slice(-shardRows.length)

  return {
    primary: getPrimaryRows(primaryStyle).map((row) => {
      return (
        page.selectedPerkIds.find((perkId) => {
          return row.includes(perkId)
        }) ?? 0
      )
    }),
    primaryStyleId: page.primaryStyleId,
    secondary: getSecondaryRows(findStyle(styles, page.subStyleId))
      .flatMap((row) => {
        return (
          page.selectedPerkIds.find((perkId) => {
            return row.includes(perkId)
          }) ?? []
        )
      })
      .slice(0, 2),
    shards: shardRows.map((row, index) => {
      const perkId = shardIds[index] ?? 0

      return row.includes(perkId) ? perkId : 0
    }),
    subStyleId: page.subStyleId,
  }
}

// A new path clears its rows. The sub path stays unless the new path is it or doesn't allow it
export function setPrimaryStyle(draft: RunePageDraft, styleId: number, styles: readonly PerkStyle[]): RunePageDraft {
  const style = findStyle(styles, styleId)

  if (!style || styleId === draft.primaryStyleId) {
    return draft
  }

  const keepsSub = draft.subStyleId !== styleId && style.allowedSubStyles.includes(draft.subStyleId)

  return {
    ...draft,
    primary: getPrimaryRows(style).map(() => {
      return 0
    }),
    primaryStyleId: styleId,
    secondary: keepsSub ? draft.secondary : [],
    subStyleId: keepsSub ? draft.subStyleId : style.defaultSubStyle,
  }
}

export function setSubStyle(draft: RunePageDraft, styleId: number): RunePageDraft {
  return styleId === draft.subStyleId ? draft : { ...draft, secondary: [], subStyleId: styleId }
}

function replaceAt(ids: readonly number[], index: number, perkId: number): number[] {
  return ids.map((id, each) => {
    return each === index ? perkId : id
  })
}

export function pickPrimaryPerk(draft: RunePageDraft, row: number, perkId: number): RunePageDraft {
  return { ...draft, primary: replaceAt(draft.primary, row, perkId) }
}

export function pickShard(draft: RunePageDraft, row: number, perkId: number): RunePageDraft {
  return { ...draft, shards: replaceAt(draft.shards, row, perkId) }
}

// A pick replaces the one in its row; a third row drops the oldest of the two
export function pickSecondaryPerk(draft: RunePageDraft, rows: readonly number[][], perkId: number): RunePageDraft {
  const row = findRow(rows, perkId)

  if (row === -1) {
    return draft
  }

  const kept = draft.secondary.filter((id) => {
    return findRow(rows, id) !== row
  })

  return { ...draft, secondary: [...kept, perkId].slice(-2) }
}

export function isRunePageDraftComplete(draft: RunePageDraft): boolean {
  return (
    draft.secondary.length === 2 &&
    [...draft.primary, ...draft.shards].every((perkId) => {
      return perkId > 0
    })
  )
}

// The page's perks in the client's order: keystone, primary rows, secondary by row, shards
export function toSelectedPerkIds(draft: RunePageDraft, secondaryRows: readonly number[][]): number[] {
  const secondary = draft.secondary.toSorted((a, b) => {
    return findRow(secondaryRows, a) - findRow(secondaryRows, b)
  })

  return [...draft.primary, ...secondary, ...draft.shards]
}
