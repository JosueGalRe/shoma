import { useState } from 'react'

import { Checkbox } from '@shoma/ui/checkbox'
import { Icon } from '@shoma/ui/icon'
import { Radio, RadioGroup } from '@shoma/ui/radio-group'
import { Switch } from '@shoma/ui/switch'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'

// The Social "Options" sheet (radios and checkboxes) and the lobby's party switch, then the disabled states
export function FormControlsShowcase() {
  const [sort, setSort] = useState('status')
  const [groups, setGroups] = useState({ games: false, mobile: false, offline: true })
  const [openParty, setOpenParty] = useState(false)

  return (
    <section {...props(styles.section)}>
      <h2 {...props(text.heading3, styles.heading)}>RadioGroup, Checkbox, Switch</h2>

      <div {...props(styles.panel)}>
        <RadioGroup aria-label="Sort" value={sort} onValueChange={setSort}>
          <Radio label="Sort Alphabetically" value="alphabetically" />

          <Radio label="Sort by Status" value="status" />
        </RadioGroup>

        <hr {...props(styles.divider)} />

        <Checkbox
          checked={groups.games}
          label="Group Games and Servers"
          onCheckedChange={(games) => {
            setGroups({ ...groups, games })
          }}
        />

        <Checkbox
          checked={groups.mobile}
          label="Group Riot Mobile"
          onCheckedChange={(mobile) => {
            setGroups({ ...groups, mobile })
          }}
        />

        <Checkbox
          checked={groups.offline}
          label="Group Offline"
          onCheckedChange={(offline) => {
            setGroups({ ...groups, offline })
          }}
        />

        <div {...props(styles.party)}>
          <span {...props(text.marcellus13)}>{openParty ? 'OPEN PARTY' : 'CLOSED PARTY'}</span>

          <Switch
            aria-label="Open party"
            checked={openParty}
            icon={<Icon name="group" size={14} />}
            onCheckedChange={setOpenParty}
          />
        </div>
      </div>

      <div {...props(styles.panel)}>
        <RadioGroup aria-label="Disabled" disabled value="b">
          <Radio label="Disabled" value="a" />

          <Radio label="Disabled, selected" value="b" />
        </RadioGroup>

        <Checkbox checked disabled label="Disabled, selected" />

        <div {...props(styles.party)}>
          <Switch aria-label="Off, disabled" disabled icon={<Icon name="group" size={14} />} />

          <Switch aria-label="On, disabled" checked disabled icon={<Icon name="group" size={14} />} />
        </div>
      </div>
    </section>
  )
}

const styles = create({
  divider: {
    borderColor: color.text,
    borderStyle: 'solid',
    borderTopWidth: 1,
    borderWidth: 0,
    margin: 0,
    marginBlock: 4,
  },
  heading: {
    margin: 0,
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    maxWidth: 364,
  },
  party: {
    alignItems: 'center',
    color: color.text,
    display: 'flex',
    gap: 16,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
})
