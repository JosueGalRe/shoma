const positions = [
  { labelKey: 'swiftplay.positions.top', value: 'top' },
  { labelKey: 'swiftplay.positions.jungle', value: 'jungle' },
  { labelKey: 'swiftplay.positions.middle', value: 'middle' },
  { labelKey: 'swiftplay.positions.bottom', value: 'bottom' },
  { labelKey: 'swiftplay.positions.utility', value: 'utility' },
  { labelKey: 'swiftplay.positions.fill', value: 'fill' },
] as const

export function championSkinUrl(championKey: string | null, skinNum: number | null): string | null {
  if (!championKey || skinNum === null) {
    return null
  }

  return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${championKey}_${skinNum}.jpg`
}

export { positions }
