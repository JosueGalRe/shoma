import { useMemo, useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui'
import { useChampions, useChampionSkins, useLatestDdragonVersion, useRunes } from '@/core/http/ddragon-client'
import { useSetQuickplayPlayerSlots } from '@/core/lcu/lcu-mutations'
import { createLcuQueryOptions, perksPagesDescriptor, summonerSpellsDescriptor } from '@/core/lcu/lcu-queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'
import { selectSwiftplayErrors, selectSwiftplayIsValid, useSwiftplayStore } from '@/features/swiftplay/swiftplay-store'

import { OptionCard } from './-components/option-card'
import { swiftplayStyles } from './-styles'
import { buildPlayerSlotsBody } from './-utils'

export function SwiftplayRouteComponent() {
  const { t } = useTranslation()
  const navigate = useNavigate({ from: '/connected/swiftplay' })
  const [submitError, setSubmitError] = useState<string | null>(null)
  const styles = swiftplayStyles()
  const transport = useSharedLCUTransport()
  const ddragonVersion = useLatestDdragonVersion()
  const championsQuery = useChampions()
  const runesQuery = useRunes()
  const spellsQuery = useQuery(createLcuQueryOptions(summonerSpellsDescriptor, transport))
  const perkPagesQuery = useQuery(createLcuQueryOptions(perksPagesDescriptor, transport))
  const option1 = useSwiftplayStore((state) => {
    return state.myConfig.option1
  })
  const option2 = useSwiftplayStore((state) => {
    return state.myConfig.option2
  })
  const isValid = useSwiftplayStore(selectSwiftplayIsValid)
  const errors = useSwiftplayStore(selectSwiftplayErrors)
  const option1SkinsQuery = useChampionSkins(option1.championId ?? undefined)
  const option2SkinsQuery = useChampionSkins(option2.championId ?? undefined)
  const playerSlotsBody = useMemo(() => {
    return buildPlayerSlotsBody(
      [option1, option2],
      [option1SkinsQuery.data ?? [], option2SkinsQuery.data ?? []],
      perkPagesQuery.data ?? [],
    )
  }, [option1, option1SkinsQuery.data, option2, option2SkinsQuery.data, perkPagesQuery.data])
  const setQuickplayPlayerSlotsMutation = useSetQuickplayPlayerSlots(playerSlotsBody ?? [])
  const isSubmitDisabled =
    !isValid ||
    championsQuery.isLoading ||
    option1SkinsQuery.isLoading ||
    option2SkinsQuery.isLoading ||
    perkPagesQuery.isLoading ||
    setQuickplayPlayerSlotsMutation.isPending

  async function submitSwiftplayConfig() {
    setSubmitError(null)

    if (!playerSlotsBody) {
      setSubmitError('swiftplay.errors.invalidLcuConfig')

      return
    }

    try {
      await setQuickplayPlayerSlotsMutation.mutateAsync()
      await navigate({ to: '/connected/lobby' })
    } catch {
      setSubmitError('swiftplay.errors.submitFailed')
    }
  }

  return (
    <main className={styles.main()}>
      <PageHeader title={t('swiftplay.title')} subtitle={isValid ? t('swiftplay.complete') : t('swiftplay.incomplete')} />

      {errors.length > 0 ? (
        <div className={styles.banner()} aria-live="polite">
          {errors
            .map((error) => {
              return t(error)
            })
            .join(' ')}
        </div>
      ) : null}

      {submitError ? (
        <div className={styles.banner()} aria-live="polite">
          {t(submitError)}
        </div>
      ) : null}

      <div className={styles.options()}>
        <OptionCard
          champions={championsQuery.data}
          ddragonVersion={ddragonVersion.data}
          isLoading={championsQuery.isLoading}
          option={option1}
          optionIndex={1}
          runeTrees={runesQuery.data ?? []}
          summonerSpells={spellsQuery.data ?? []}
        />

        <OptionCard
          champions={championsQuery.data}
          ddragonVersion={ddragonVersion.data}
          isLoading={championsQuery.isLoading}
          option={option2}
          optionIndex={2}
          runeTrees={runesQuery.data ?? []}
          summonerSpells={spellsQuery.data ?? []}
        />
      </div>

      <Button
        className={styles.submitButton()}
        disabled={isSubmitDisabled}
        onClick={() => {
          void submitSwiftplayConfig()
        }}
        variant="primary"
      >
        {t('swiftplay.enterQueue')}
      </Button>
    </main>
  )
}
