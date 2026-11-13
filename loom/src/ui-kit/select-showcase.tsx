import { useState } from 'react'

import { Radio, RadioGroup } from '@shoma/ui/radio-group'
import { Select } from '@shoma/ui/select'
import { text } from '@shoma/ui/text'
import { TextField } from '@shoma/ui/text-field'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'

const gameTypes = [
  { label: 'All Random', value: 'all-random' },
  { label: 'ARAM: Mayhem', value: 'aram-mayhem' },
  { label: 'Blind Pick', value: 'blind-pick' },
  { label: 'Draft Mode', value: 'draft' },
  { label: 'Tournament Draft', value: 'tournament-draft' },
]

const teamSizes = [1, 2, 3, 4, 5].map((size) => {
  return { label: String(size), value: String(size) }
})

// The Figma "Create Custom" screen: name, game type and team size, then its uppercase radio group
export function SelectShowcase() {
  const [name, setName] = useState("Sol's Game")
  const [gameType, setGameType] = useState<string | null>('blind-pick')
  const [teamSize, setTeamSize] = useState<string | null>(null)
  const [spectators, setSpectators] = useState('lobby only')

  return (
    <section {...props(styles.section)}>
      <h2 {...props(text.heading3, styles.heading)}>Select</h2>

      <div {...props(styles.screen)}>
        <TextField clearLabel="Clear" label="Name" value={name} onValueChange={setName} />

        <Select label="Game type" options={gameTypes} value={gameType} onValueChange={setGameType} />

        <Select
          error={teamSize === null ? 'Pick a team size' : undefined}
          label="Team size"
          options={teamSizes}
          placeholder="Team size"
          value={teamSize}
          onValueChange={setTeamSize}
        />

        <Select
          disabled
          label="Map type"
          options={[{ label: 'Howling Abyss', value: 'ha' }]}
          value="ha"
          onValueChange={() => {}}
        />

        <RadioGroup aria-label="Allow spectators" value={spectators} onValueChange={setSpectators}>
          <span {...props(text.marcellus13, styles.groupLabel)}>Allow spectators</span>

          {['Lobby only', 'Friends list only', 'All', 'None'].map((label) => {
            return <Radio key={label} label={label} style={styles.capsLabel} value={label.toLowerCase()} />
          })}
        </RadioGroup>
      </div>
    </section>
  )
}

const styles = create({
  capsLabel: {
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  groupLabel: {
    color: color.textLabel,
    textTransform: 'uppercase',
  },
  heading: {
    margin: 0,
  },
  screen: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    maxWidth: 364,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
})
