import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { BenchItem } from './bench-item'
import { benchStyles } from './bench-styles'

import type { BenchProps } from './bench-types'

export function Bench({ bench, onSwap }: BenchProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('champSelect.bench')}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className={benchStyles.listContainer}>
          {bench.map((championId) => {
            return <BenchItem key={championId} championId={championId} onSwap={onSwap} />
          })}
        </div>
      </CardContent>
    </Card>
  )
}
