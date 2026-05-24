import type { SwiftplayConfig } from './swiftplay-store-types'
import type { SwiftplayOption } from './swiftplay-store-types'

export const EMPTY_SWIFTPLAY_ERRORS: string[] = []
export const BOTH_SWIFTPLAY_OPTIONS_REQUIRED_ERRORS = ['swiftplay.errors.bothOptionsRequired']

export function isOptionComplete(option: SwiftplayOption): boolean {
  return (
    option.championId !== null &&
    option.position !== null &&
    option.runeId !== null &&
    option.spell1Id !== null &&
    option.spell2Id !== null &&
    option.skinId !== null
  )
}

export function validateConfig(config: SwiftplayConfig): { errors: string[]; isValid: boolean } {
  const errors: string[] = []

  const isOption1Complete = isOptionComplete(config.option1)
  const isOption2Complete = isOptionComplete(config.option2)

  if (!isOption1Complete || !isOption2Complete) {
    errors.push('swiftplay.errors.bothOptionsRequired')
  }

  return {
    errors,
    isValid: isOption1Complete && isOption2Complete,
  }
}
