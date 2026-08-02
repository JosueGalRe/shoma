import { RoleSlotStrip } from '@/features/lobby/components/role-slot-strip'

import { lobbyStyles } from '../-styles'

import type { LobbyQueueSectionProps } from './lobby-queue-section-types'

export function LobbyQueueSection({
  isSearching,
  canJoinQueue,
  isLowPriorityQueue,
  onCancelQueue,
  onJoinQueue,
  searchLabel,
  roleStrip,
  t,
}: LobbyQueueSectionProps) {
  return (
    <section className="shrink-0 p-4">
      <div className="relative">
        <div className={`${lobbyStyles.queueWave} ${isSearching ? 'opacity-100' : 'opacity-0'}`} />

        <div className={lobbyStyles.queueContainer}>
          {isSearching ? (
            <button className={lobbyStyles.cancelButton} onClick={onCancelQueue} type="button">
              {t('queue.cancel')}
            </button>
          ) : (
            <div className="flex w-full items-center gap-3">
              <button className={lobbyStyles.findMatchButton} disabled={!canJoinQueue} onClick={onJoinQueue} type="button">
                {t('queue.findMatch')}
              </button>

              {roleStrip ? (
                <RoleSlotStrip
                  disabled={roleStrip.disabled}
                  first={roleStrip.first}
                  onSelect={roleStrip.handleSelect}
                  second={roleStrip.second}
                  t={t}
                />
              ) : null}
            </div>
          )}

          <div className="mt-2 flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${isSearching ? lobbyStyles.queueStatusDotSearching : lobbyStyles.queueStatusDotIdle}`}
              />

              <span className={lobbyStyles.queueSearchLabel}>{searchLabel}</span>
            </div>

            {isLowPriorityQueue ? (
              <span className="text-[10px] font-bold tracking-wider text-[rgb(232,64,87)] uppercase">
                {t('queue.lowPriority')}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
