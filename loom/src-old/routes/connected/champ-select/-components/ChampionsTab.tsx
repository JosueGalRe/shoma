import { useState, useEffect, useRef, useDeferredValue } from 'react'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { ChampSelectState } from '@core/rift/rift-lcu-types'
import type { ChampionMetadataById } from '@core/http/ddragon-client'
import { buildChampionSplashUrl } from '../../lobby/-lobby-utils'

interface ChampionsTabProps {
  champSelectState: ChampSelectState | null
  championNamesById: Record<number, string>
  championMetadataById: ChampionMetadataById
  visibleSelectableChampionIds: number[]
  championSelectionDraft: string
  updateChampionSelectionDraft: (value: string) => Promise<void>
  completeCurrentChampSelectAction: () => Promise<void>
  patchChampSelectSelection: (championId: number) => Promise<void>
}

const ROLES = ['Fighter', 'Tank', 'Mage', 'Assassin', 'Support', 'Marksman']

export function ChampionsTab({
  champSelectState,
  championNamesById,
  championMetadataById,
  visibleSelectableChampionIds,
  championSelectionDraft,
  updateChampionSelectionDraft,
  completeCurrentChampSelectAction,
  patchChampSelectSelection,
}: ChampionsTabProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  const allChampionIds = Object.keys(championNamesById).map(Number).filter((id) => Number.isFinite(id))

  const filteredChampionIds = allChampionIds.filter((id) => {
    const metadata = championMetadataById[id]
    if (selectedRole && (!metadata || !metadata.tags.includes(selectedRole))) {
      return false
    }

    if (!deferredSearchQuery) return true
    const name = championNamesById[id]
    if (!name) return false
    return name.toLowerCase().includes(deferredSearchQuery.toLowerCase())
  })

  if (!champSelectState || (champSelectState.currentActionId === null && champSelectState.hoverActionId === null)) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center">
        <p className="text-muted-foreground italic">{t(($) => $.connected.champSelectNoSession)}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex flex-col gap-3">
        <Input
          placeholder="Search champions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-background/60 border-gold-dim/50 focus-visible:ring-primary text-foreground"
        />
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {ROLES.map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(selectedRole === role ? null : role)}
              className={`
                px-3 py-1 rounded-full text-xs font-display tracking-wider uppercase whitespace-nowrap transition-colors border
                ${selectedRole === role 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-background/40 text-muted-foreground border-gold-dim/30 hover:border-gold-dim/70'}
              `}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {allChampionIds.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 overflow-y-auto p-1 content-start">
          {filteredChampionIds.map((championId) => {
            const isSelected = championSelectionDraft === String(championId)
            const isBanned = champSelectState.bannedChampionIds.includes(championId)
            const isBench = champSelectState.benchChampionIds.includes(championId)
            const isPickedByMe = champSelectState.hasLockedChampion && champSelectState.localPlayerChampionId === championId
            const isSelectable = visibleSelectableChampionIds.includes(championId)
            const isUnavailable = !isSelectable && !isBanned && !isBench && !isPickedByMe
            
            const championName = championNamesById[championId]
            const championKey = championMetadataById[championId]?.key
            const splashUrl = championKey ? buildChampionSplashUrl(championKey) : null
            
            let stateClasses = 'border-gold-dim/50 hover:border-primary/70 hover:scale-105'
            if (isBanned) {
              stateClasses = 'border-destructive/50 grayscale opacity-50 cursor-not-allowed'
            } else if (isPickedByMe) {
              stateClasses = 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)] scale-105 z-10'
            } else if (isUnavailable) {
              stateClasses = 'border-muted-foreground/30 grayscale opacity-50 cursor-not-allowed'
            } else if (isSelected) {
              stateClasses = 'border-primary shadow-[0_0_10px_rgba(200,169,110,0.4)] scale-105 z-10'
            } else if (isBench) {
              stateClasses = 'border-muted-foreground/50 grayscale opacity-70'
            }
            
            return (
              <ChampionGridItem
                key={championId}
                championName={championName}
                splashUrl={splashUrl}
                stateClasses={stateClasses}
                disabled={isBanned || isUnavailable}
                onClick={() => {
                  if (!isBanned && !isUnavailable) {
                    void updateChampionSelectionDraft(String(championId))
                  }
                }}
              />
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 24 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[16/9] w-full rounded-lg" />
          ))}
        </div>
      )}

      <div className="flex justify-end mt-auto pt-4 gap-2 border-t border-gold-dim/20">
        {champSelectState.currentActionType !== 'pick' ? (
          <Button
            variant="outline"
            className="font-display tracking-wider uppercase"
            disabled={championSelectionDraft.length === 0}
            onClick={() => {
              if (champSelectState.currentActionType === 'ban') {
                void completeCurrentChampSelectAction()
                return
              }
              void patchChampSelectSelection(Number(championSelectionDraft))
            }}
            type="button"
          >
            {champSelectState.currentActionType === 'ban'
              ? t(($) => $.connected.champSelectActionBan)
              : t(($) => $.connected.champSelectActionHover)}
          </Button>
        ) : null}
        {champSelectState.currentActionType === 'pick' ? (
          <Button
            variant="hextech"
            className="font-display tracking-wider uppercase"
            disabled={
              championSelectionDraft.length === 0 ||
              (champSelectState.currentActionId === null && champSelectState.hoverActionId === null)
            }
            onClick={() => {
              void completeCurrentChampSelectAction()
            }}
            type="button"
          >
            {t(($) => $.connected.champSelectActionLock)}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

interface ChampionGridItemProps {
  championName: string | undefined
  splashUrl: string | null
  stateClasses: string
  disabled: boolean
  onClick: () => void
}

function ChampionGridItem({ championName, splashUrl, stateClasses, disabled, onClick }: ChampionGridItemProps) {
  const { t } = useTranslation()
  const imgRef = useRef<HTMLImageElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const img = imgRef.current
    if (!img) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLImageElement
            if (target.dataset.src) {
              target.src = target.dataset.src
              target.removeAttribute('data-src')
            }
            observer.unobserve(target)
          }
        })
      },
      { rootMargin: '50px' }
    )

    observer.observe(img)
    return () => observer.disconnect()
  }, [])

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`
        relative group aspect-[16/9] rounded-lg border-2 overflow-hidden transition-all
        ${stateClasses}
      `}
    >
      {splashUrl ? (
        <img
          ref={imgRef}
          data-src={splashUrl}
          alt={championName || 'Champion Splash Art'}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          className={`h-full w-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-background text-xs text-muted-foreground">
          ?
        </div>
      )}
      
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-foreground text-[10px] sm:text-xs text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity truncate px-1">
        {championName || t(($) => $.connected.unknown)}
      </div>
    </button>
  )
}
