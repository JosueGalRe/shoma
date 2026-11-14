import { Icon } from '@shoma/ui/icon'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'

import type { IconName } from '@shoma/ui/icon'

// In the Figma UI KIT "Icons" frame's order
const names: IconName[] = [
  'arrow-left',
  'arrow-right',
  'arrow-up',
  'arrow-down',
  'sort',
  'add-folder',
  'close',
  'info',
  'switch',
  'question-mark',
  'warning',
  'error',
  'group',
  'person',
  'success',
  'checkmark',
  'block',
  'send',
  'add',
  'champion',
  'edit',
  'rune',
  'add-friend',
  'chat',
  'position-top',
  'position-jungle',
  'position-middle',
  'position-bottom',
  'position-support',
  'spell',
  'sentinel',
  'dashboard',
  'tacticians',
  'emote',
]

export function IconsShowcase() {
  return (
    <section {...props(styles.section)}>
      <h2 {...props(text.heading3, styles.heading)}>Icon</h2>

      <ul {...props(styles.grid)}>
        {names.map((name) => {
          return (
            <li key={name} {...props(styles.item)}>
              <Icon name={name} />

              <span {...props(text.body4, styles.name)}>{name}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

const styles = create({
  grid: {
    display: 'grid',
    gap: 16,
    gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  heading: {
    margin: 0,
  },
  item: {
    alignItems: 'center',
    color: color.icon,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  name: {
    color: color.textSecondary,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
})
