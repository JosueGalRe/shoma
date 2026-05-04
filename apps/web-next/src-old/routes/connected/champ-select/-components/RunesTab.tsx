import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { ConnectedRunePage } from '../../lobby/-lobby-runes'

interface RunesTabProps {
  runePages: ConnectedRunePage[]
  activeRunePage: ConnectedRunePage | null
  onSelectRunePage: (id: number) => void
  runeUpdatePending: boolean
}

export function RunesTab({
  runePages,
  activeRunePage,
  onSelectRunePage,
  runeUpdatePending,
}: RunesTabProps) {
  const { t } = useTranslation()

  if (runePages.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-1 content-start h-full overflow-y-auto">
      {runePages.map((runePage) => {
        const isActive = activeRunePage?.id === runePage.id
        
        return (
          <button
            key={runePage.id}
            type="button"
            disabled={runeUpdatePending}
            onClick={() => onSelectRunePage(runePage.id)}
            className={`
              flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left
              ${isActive 
                ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(200,169,110,0.2)]' 
                : 'border-gold-dim/30 bg-background/40 hover:border-primary/50 hover:bg-background/60'}
            `}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className={`font-display tracking-wider uppercase text-sm ${isActive ? 'text-primary' : 'text-foreground'}`}>
                {runePage.name}
              </span>
              {isActive && (
                <span className="text-[10px] font-bold text-primary border border-primary px-1.5 py-0.5 rounded">
                  ACTIVE
                </span>
              )}
            </div>
            
            <div className="text-xs text-muted-foreground mt-auto">
              {runePage.isEditable ? 'Custom Page' : 'Preset Page'}
            </div>
          </button>
        )
      })}
    </div>
  )
}
