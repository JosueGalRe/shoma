import { useId } from 'react'

import { Radio, RadioGroup } from '@shoma/ui/radio-group'
import { Select } from '@shoma/ui/select'
import { text } from '@shoma/ui/text'
import { TextField } from '@shoma/ui/text-field'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { getGameTypeKey } from '@/features/lobby/create-lobby-utils'

import type { CustomStepProps } from './create-lobby-steps-types'
import type { SpectatorPolicy } from '@/features/lobby/create-lobby-types'

const TEAM_SIZES = ['1', '2', '3', '4', '5'].map((size) => {
  return { label: size, value: size }
})

const SPECTATOR_POLICIES = [
  ['LobbyAllowed', 'createLobby.custom.spectators.lobby'],
  ['FriendsAllowed', 'createLobby.custom.spectators.friends'],
  ['AllAllowed', 'createLobby.custom.spectators.all'],
  ['NotAllowed', 'createLobby.custom.spectators.none'],
] as const satisfies readonly (readonly [SpectatorPolicy, string])[]

// Figma "Create Custom": the game's name, its queue as the game type, ARAM's map skin, and who may watch
export function CustomStep({ aramMaps, form, lobbyName, onFormChange, onQueueChange, queueId, queues }: CustomStepProps) {
  const { t } = useTranslation()
  const spectatorsId = useId()
  const delayId = useId()
  const queue = queues.find(({ id }) => {
    return id === queueId
  })
  const gameTypes = queues.map((option) => {
    const key = getGameTypeKey(option)

    return { label: key ? t(key) : option.description, value: String(option.id) }
  })

  return (
    <div {...props(styles.form)}>
      <TextField
        autoComplete="off"
        clearLabel={t('createLobby.custom.clearName')}
        label={t('createLobby.custom.name')}
        maxLength={50}
        value={lobbyName}
        onValueChange={(name) => {
          onFormChange({ name })
        }}
      />

      <Select
        label={t('createLobby.custom.gameType')}
        options={gameTypes}
        value={queueId === undefined ? null : String(queueId)}
        onValueChange={(value) => {
          onQueueChange(Number(value))
        }}
      />

      {queue?.gameMode === 'ARAM' && aramMaps.length > 1 ? (
        <Select
          label={t('createLobby.custom.mapType')}
          options={aramMaps}
          value={form.aramMapMutator}
          onValueChange={(aramMapMutator) => {
            onFormChange({ aramMapMutator })
          }}
        />
      ) : null}

      <Select
        label={t('createLobby.custom.teamSize')}
        options={TEAM_SIZES}
        value={String(form.teamSize)}
        onValueChange={(value) => {
          onFormChange({ teamSize: Number(value) })
        }}
      />

      <TextField
        autoComplete="off"
        label={t('createLobby.custom.password')}
        placeholder={t('createLobby.custom.passwordPlaceholder')}
        value={form.password}
        onValueChange={(password) => {
          onFormChange({ password })
        }}
      />

      <div {...props(styles.group)}>
        <span id={spectatorsId} {...props(text.marcellus13, styles.label)}>
          {t('createLobby.custom.allowSpectators')}
        </span>

        <RadioGroup
          aria-labelledby={spectatorsId}
          value={form.spectatorPolicy}
          onValueChange={(spectatorPolicy) => {
            onFormChange({ spectatorPolicy })
          }}
        >
          {SPECTATOR_POLICIES.map(([policy, key]) => {
            return <Radio key={policy} label={t(key)} style={styles.option} value={policy} />
          })}
        </RadioGroup>
      </div>

      <div {...props(styles.group)}>
        <span id={delayId} {...props(text.marcellus13, styles.label)}>
          {t('createLobby.custom.spectatorDelay')}
        </span>

        <RadioGroup
          aria-labelledby={delayId}
          value={form.spectatorDelayEnabled}
          onValueChange={(spectatorDelayEnabled) => {
            onFormChange({ spectatorDelayEnabled })
          }}
        >
          <Radio label={t('createLobby.custom.addDelay')} style={styles.option} value />

          <Radio label={t('createLobby.custom.noDelay')} style={styles.option} value={false} />
        </RadioGroup>
      </div>
    </div>
  )
}

const styles = create({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 32,
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  label: {
    color: color.textLabel,
    textTransform: 'uppercase',
  },
  option: {
    textTransform: 'uppercase',
  },
})
