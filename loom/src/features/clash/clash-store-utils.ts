import type { ClashPhase, ClashStoreSelector } from './clash-store-types';


const clashPhaseSelectorCache = new Map<ClashPhase, ClashStoreSelector<boolean>>()

export function selectIsClashPhase(phase: ClashPhase): ClashStoreSelector<boolean> {
  const cachedSelector = clashPhaseSelectorCache.get(phase)

  if (cachedSelector) {
    return cachedSelector
  }

  const selector: ClashStoreSelector<boolean> = (state) => {
    return state.phase === phase
  }

  clashPhaseSelectorCache.set(phase, selector)

  return selector
}
