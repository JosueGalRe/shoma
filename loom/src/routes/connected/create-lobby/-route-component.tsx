import { useState } from 'react'

import { Button } from '@shoma/ui/button'
import { Loader } from '@shoma/ui/loader'
import { ScreenBackground } from '@shoma/ui/screen-background'
import { ScrollArea } from '@shoma/ui/scroll-area'
import { Stepper } from '@shoma/ui/stepper'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, keyframes, props } from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { TopBar } from '@/components/layout/top-bar'
import { useCreateLobby } from '@/core/lcu/lcu-mutations'
import { createLcuQueryOptions, currentSummonerDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'
import {
  DEFAULT_CUSTOM_GAME_FORM,
  getCategoryQueues,
  getCreateLobbyBody,
  getCustomLobbyBody,
  getDefaultOption,
  getPvpModes,
} from '@/features/lobby/create-lobby-utils'
import { useCreateLobbyModes } from '@/features/lobby/hooks/use-create-lobby-modes'
import { parseCurrentSummonerPayload } from '@/features/lobby/hooks/use-lobby-support'

import { CategoryStep } from './-components/category-step'
import { CustomStep } from './-components/custom-step'
import { ModeStep } from './-components/mode-step'
import { OptionStep } from './-components/option-step'

import type { CreateLobbyCategory, CreateLobbyOption, CustomGameForm } from '@/features/lobby/create-lobby-types'

const STEP_TITLES = {
  1: 'createLobby.steps.category',
  2: 'createLobby.steps.mode',
  3: 'createLobby.steps.option',
} as const

// Figma "Create Lobby": category, then mode (PvP and custom only, the others are one mode each), then the queue.
// A custom game picks its queue as the game type of the Create Custom form
export function CreateLobbyRouteComponent() {
  const { t } = useTranslation()
  const navigate = useNavigate({ from: '/connected/create-lobby' })
  const transport = useSharedLCUTransport()
  const { aramMaps, customModes, isLoading, modes } = useCreateLobbyModes()
  const summonerQuery = useQuery(createLcuQueryOptions(currentSummonerDescriptor, transport))
  const createLobby = useCreateLobby()
  const [step, setStep] = useState<keyof typeof STEP_TITLES>(1)
  const [category, setCategory] = useState<CreateLobbyCategory>('pvp')
  const [pickedModeId, setPickedModeId] = useState<string>()
  const [pickedOption, setPickedOption] = useState<CreateLobbyOption>()
  const [customForm, setCustomForm] = useState<CustomGameForm>(DEFAULT_CUSTOM_GAME_FORM)

  const isCustom = category === 'custom'
  const stepModes = isCustom ? customModes : getPvpModes(modes)
  const modeId = pickedModeId ?? stepModes[0]?.id
  const queues = getCategoryQueues(isCustom ? customModes : modes, category, modeId)
  const option = pickedOption ?? getDefaultOption(category, queues)
  const hasModeStep = category === 'pvp' || isCustom
  const gameName = parseCurrentSummonerPayload(summonerQuery.data)?.gameName
  const lobbyName = customForm.name ?? (gameName ? t('createLobby.custom.defaultName', { name: gameName }) : '')
  // The categories are fixed; only the next steps wait for the client's queues
  const isWaiting = isLoading && step !== 1
  const isEmpty = (step === 2 && stepModes.length === 0) || (step === 3 && option === undefined)
  const isCustomFormIncomplete = isCustom && step === 3 && lobbyName.trim() === ''

  function goToLobby() {
    void navigate({ to: '/connected/lobby' })
  }

  function handleBack() {
    if (step === 1) {
      goToLobby()

      return
    }

    setStep(step === 3 && hasModeStep ? 2 : 1)
  }

  function handleNext() {
    if (step !== 3) {
      setStep(step === 1 && hasModeStep ? 2 : 3)

      return
    }

    if (isCustom) {
      const queue = queues.find(({ id }) => {
        return id === option
      })
      const body = queue ? getCustomLobbyBody(queue, customForm, lobbyName) : null

      if (body) {
        createLobby.mutate(body, { onSuccess: goToLobby })
      }

      return
    }

    if (option !== undefined) {
      createLobby.mutate(getCreateLobbyBody(option), { onSuccess: goToLobby })
    }
  }

  function renderStep() {
    if (isWaiting) {
      return <Loader aria-label={t('createLobby.loading')} style={styles.status} />
    }

    if (isEmpty) {
      return <p {...props(text.body2, styles.empty)}>{t('createLobby.noQueues')}</p>
    }

    if (step === 1) {
      return (
        <CategoryStep
          category={category}
          onCategoryChange={(next) => {
            setCategory(next)
            setPickedModeId(undefined)
            setPickedOption(undefined)
          }}
        />
      )
    }

    if (step === 2) {
      return (
        <ModeStep
          modeId={modeId}
          modes={stepModes}
          onModeChange={(next) => {
            setPickedModeId(next)
            setPickedOption(undefined)
          }}
        />
      )
    }

    if (isCustom) {
      return (
        <CustomStep
          aramMaps={aramMaps}
          form={customForm}
          lobbyName={lobbyName}
          queueId={typeof option === 'number' ? option : undefined}
          queues={queues}
          onQueueChange={setPickedOption}
          onFormChange={(patch) => {
            setCustomForm({ ...customForm, ...patch })
          }}
        />
      )
    }

    return (
      <OptionStep option={option} queues={queues} withPracticeTool={category === 'training'} onOptionChange={setPickedOption} />
    )
  }

  return (
    <div {...props(styles.screen)}>
      <ScreenBackground />

      <TopBar onBack={handleBack} />

      <ScrollArea key={step} contentStyle={styles.content} style={styles.scroll}>
        <h1 {...props(text.heading1, styles.title)}>
          {t(isCustom && step === 3 ? 'createLobby.steps.custom' : STEP_TITLES[step])}
        </h1>

        {renderStep()}
      </ScrollArea>

      <footer {...props(styles.footer)}>
        <Stepper aria-label={t('createLobby.title')} aria-valuetext={t('createLobby.stepOf', { step, steps: 3 })} step={step} />

        {createLobby.isError ? (
          <p role="alert" {...props(text.body4, styles.error)}>
            {t('createLobby.createError')}
          </p>
        ) : null}

        <Button
          disabled={isWaiting || isEmpty || isCustomFormIncomplete || createLobby.isPending}
          style={styles.action}
          onClick={handleNext}
        >
          {step === 3 ? t('createLobby.confirm') : t('createLobby.next')}
        </Button>
      </footer>
    </div>
  )
}

const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

const styles = create({
  action: {
    marginInline: 24,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 32,
    paddingBlock: 32,
    paddingInline: 24,
  },
  empty: {
    color: color.textSecondary,
    margin: 0,
  },
  error: {
    color: color.danger,
    margin: 0,
    marginInline: 24,
  },
  // Figma "Bottom Action": the stepper along its top edge, the button 18px under it and 16px from the bottom, as in the lobby
  footer: {
    backgroundColor: color.background,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    gap: 18,
    paddingBlockEnd: 16,
  },
  screen: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minHeight: 0,
  },
  // Remounted per step, so each step fades in from its top
  scroll: {
    animationDuration: '200ms',
    animationName: fadeIn,
    animationTimingFunction: 'ease-out',
    flexGrow: 1,
  },
  status: {
    alignSelf: 'center',
    marginBlockStart: 40,
  },
  title: {
    color: color.text,
    margin: 0,
  },
})
