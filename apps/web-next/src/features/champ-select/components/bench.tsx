import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface BenchProps {
  bench: number[]
  canReroll: boolean
  rerollCount: number
  isLoading: boolean
  onReroll: () => void
  onSwap: (championId: number) => void
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
        <Button className="w-full" disabled={!canReroll || isLoading} onClick={onReroll}>
          {t('champSelect.reroll')} ({rerollCount})
        </Button>
        <div className="grid grid-cols-2 gap-2">
          {bench.map((championId) => (
            <Button className="border-lol-border-subtle bg-lol-navy-900/60" key={championId} onClick={() => onSwap(championId)} size="sm" variant="secondary">
              {t('champSelect.championLabel', { value: championId })}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
