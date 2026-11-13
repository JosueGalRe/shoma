import { Chip } from '@shoma/ui/chip'
import { text } from '@shoma/ui/text'
import { create, props } from '@stylexjs/stylex'

// The dashboard's client status
export function ChipShowcase() {
  return (
    <section {...props(styles.section)}>
      <h2 {...props(text.heading3, styles.heading)}>Chip</h2>

      <div>
        <Chip>Connected</Chip>
      </div>
    </section>
  )
}

const styles = create({
  heading: {
    margin: 0,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
})
