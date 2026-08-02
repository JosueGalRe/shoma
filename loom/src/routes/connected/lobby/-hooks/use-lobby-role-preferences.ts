import {
  normalizeRankedRoles,
  rankedRolesToPreferences,
  swapRankedRole,
} from '@/features/lobby/utils/compute-ranked-role-preferences'
import { computeRolePreferences } from '@/features/lobby/utils/compute-role-preferences'
import { JADE_RANKED_SOLO_QUEUE_ID } from '@/features/modes/mode-engine'

import type { LobbyRole, LobbyRolePreferences } from '@/features/lobby/lobby-store'

interface UseLobbyRolePreferencesOptions {
  queueId: number | null
  rolePreferences: LobbyRolePreferences
  setRolePreferences: (preferences: LobbyRolePreferences) => Promise<void>
}

export function useLobbyRolePreferences({ queueId, rolePreferences, setRolePreferences }: UseLobbyRolePreferencesOptions) {
  const isJadeLobby = queueId === JADE_RANKED_SOLO_QUEUE_ID
  const rankedRoleOrder = normalizeRankedRoles(rolePreferences)
  const isFillSelected = rolePreferences.first === 'FILL'

  const handleSelectRole = async (slot: 'first' | 'second', role: LobbyRole) => {
    const next = computeRolePreferences(rolePreferences, slot, role)

    if (next.first !== rolePreferences.first || next.second !== rolePreferences.second) {
      await setRolePreferences(next)
    }
  }

  const handleSwapRankedRole = async (slotIndex: number, role: LobbyRole) => {
    const nextOrder = swapRankedRole(rankedRoleOrder, slotIndex, role)

    if (nextOrder !== rankedRoleOrder) {
      await setRolePreferences(rankedRolesToPreferences(nextOrder))
    }
  }

  const handleFillToggle = async (fill: boolean) => {
    if (fill) {
      await setRolePreferences({ first: 'FILL', second: 'UNSELECTED' })

      return
    }

    await setRolePreferences(rankedRolesToPreferences(rankedRoleOrder))
  }

  return { handleFillToggle, handleSelectRole, handleSwapRankedRole, isFillSelected, isJadeLobby, rankedRoleOrder }
}
