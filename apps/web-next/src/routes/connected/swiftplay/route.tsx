import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { useChampions } from '@/core/http/ddragon-client'
import { useSwiftplayStore, type SwiftplayOption } from '@/features/swiftplay/swiftplay-store'

const positions = [
  'Top',
  'Jungle',
  'Mid',
  'ADC',
  'Support',
] as const

function OptionCard({
  champions,
  isLoading,
  option,
  optionIndex,
}: {
  champions: Awaited<ReturnType<typeof useChampions>>['data']
  isLoading: boolean
  option: SwiftplayOption
  optionIndex: 1 | 2
}) {
  const { t } = useTranslation()
  const setOption = useSwiftplayStore((state) => state.setOption)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(optionIndex === 1 ? 'swiftplay.option1' : 'swiftplay.option2')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="block space-y-1 text-sm text-gray-300">
          <span>{t('swiftplay.champion')}</span>
          <select
            className="h-10 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-sm text-white disabled:opacity-50"
            disabled={!champions}
            onChange={(event) => {
              setOption(optionIndex, 'championId', event.target.value ? Number(event.target.value) : null)
            }}
            value={option.championId ?? ''}
          >
            <option value="">{isLoading ? t('common.loading') : t('swiftplay.champion')}</option>
            {champions?.map((champion) => (
              <option key={champion.id} value={champion.id}>
                {champion.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm text-gray-300">
          <span>{t('swiftplay.position')}</span>
          <select
            className="h-10 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-sm text-white"
            onChange={(event) => {
              setOption(optionIndex, 'position', event.target.value || null)
            }}
            value={option.position ?? ''}
          >
            <option value="">{t('swiftplay.position')}</option>
            {positions.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </label>
      </CardContent>
    </Card>
  )
}

function SwiftplayRouteComponent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const championsQuery = useChampions()
  const option1 = useSwiftplayStore((state) => state.myConfig.option1)
  const option2 = useSwiftplayStore((state) => state.myConfig.option2)
  const isValid = useSwiftplayStore((state) => state.isValid)
  const errors = useSwiftplayStore((state) => state.errors)

  return (
    <main className="space-y-4">
      <section className="space-y-1">
        <h2 className="text-xl font-bold text-white">{t('swiftplay.title')}</h2>
        <p className="text-sm text-gray-400">{isValid ? t('swiftplay.complete') : t('swiftplay.incomplete')}</p>
      </section>

      {errors.length > 0 ? (
        <div className="rounded-md border border-red-700 bg-red-950/40 p-3 text-sm text-red-200">
          {errors.map((error) => t(error)).join(' ')}
        </div>
      ) : null}

      <div className="grid gap-4">
        <OptionCard champions={championsQuery.data} isLoading={championsQuery.isLoading} option={option1} optionIndex={1} />
        <OptionCard champions={championsQuery.data} isLoading={championsQuery.isLoading} option={option2} optionIndex={2} />
      </div>

      <Button
        className="w-full"
        disabled={!isValid || championsQuery.isLoading}
        onClick={() => {
          void navigate({ to: '/connected/lobby' })
        }}
        variant="primary"
      >
        {t('swiftplay.enterQueue')}
      </Button>
    </main>
  )
}

export const Route = createFileRoute('/connected/swiftplay')({
  component: SwiftplayRouteComponent,
})
