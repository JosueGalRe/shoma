import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { BenchItem } from './bench-item'
import { benchStyles } from './bench-styles'
import type { BenchProps } from './bench-types'

export function Bench({ bench, canReroll, rerollCount, isLoading, onReroll, onSwap }: BenchProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('champSelect.bench')}</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        <Button className={benchStyles.rerollButton} disabled={!canReroll || isLoading} onClick={onReroll}>
          {t('champSelect.reroll')} ({rerollCount})
        </Button>
        <div className={benchStyles.listContainer}>
          {bench.map((championId) => {return (
            <BenchItem key={championId} championId={championId} onSwap={onSwap} />
          )})}
        </div>
      </CardContent>
    </Card>
  )
}
