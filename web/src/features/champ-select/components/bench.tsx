import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ChampionId } from '@/core/types/branded'
import { ChampionIdentity } from './champion-identity'
import { useChampions } from '@/core/http/ddragon-client'
import { getChampionName } from '@/lib/asset-resolver'

interface BenchProps {
  bench: ChampionId[]
  canReroll: boolean
  rerollCount: number
  isLoading: boolean
  onReroll: () => void
  onSwap: (championId: ChampionId) => void
}

function BenchItem({ championId, onSwap }: { championId: ChampionId, onSwap: (id: ChampionId) => void }) {
  const { t } = useTranslation()
  const { data: champions } = useChampions()
  const name = champions ? getChampionName(championId, champions) || String(championId) : String(championId)

  return (
    <div className="flex min-w-[200px] shrink-0 items-center justify-between gap-3 rounded-md border border-lol-border-subtle bg-lol-navy-900/60 p-2">
      <ChampionIdentity championId={championId} size="sm" />
      <Button 
        className="min-h-[44px] min-w-[44px]" 
        onClick={() => onSwap(championId)} 
        size="sm" 
        variant="secondary"
        aria-label={`Swap to ${name}`}
      >
        {t('champSelect.swap', 'Swap')}
      </Button>
    </div>
  )
}

export function Bench({
  bench,
  canReroll,
  rerollCount,
  isLoading,
  onReroll,
  onSwap,
}: BenchProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('champSelect.bench')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button className="w-full min-h-[44px]" disabled={!canReroll || isLoading} onClick={onReroll}>
          {t('champSelect.reroll')} ({rerollCount})
        </Button>
        <div 
          className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {bench.map((championId) => (
            <BenchItem key={championId} championId={championId} onSwap={onSwap} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
