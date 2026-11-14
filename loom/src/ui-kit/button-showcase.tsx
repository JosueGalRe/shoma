import { Button } from '@shoma/ui/button'
import { Icon } from '@shoma/ui/icon'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'

// Mirrors the Figma UI KIT "Buttons" frame: one column per hierarchy, default then disabled
export function ButtonShowcase() {
  return (
    <section {...props(styles.section)}>
      <h2 {...props(text.heading3, styles.heading)}>Button</h2>

      <div {...props(styles.grid)}>
        <div {...props(styles.column)}>
          <Button style={styles.fixedWidth}>Button</Button>

          <Button disabled style={styles.fixedWidth}>
            Button
          </Button>
        </div>

        <div {...props(styles.column)}>
          <Button style={styles.fixedWidth} variant="secondary">
            Button
          </Button>

          <Button disabled style={styles.fixedWidth} variant="secondary">
            Button
          </Button>
        </div>

        <div {...props(styles.column)}>
          <Button variant="tertiary">Button</Button>

          <Button disabled variant="tertiary">
            Button
          </Button>

          <Button size="medium" variant="tertiary">
            <Icon name="add" size={16} />
            Button
          </Button>

          <Button disabled size="medium" variant="tertiary">
            <Icon name="add" size={16} />
            Button
          </Button>
        </div>
      </div>

      <h3 {...props(text.body2, styles.caption)}>Full width, 412px screen</h3>

      <div {...props(styles.screen)}>
        <Button style={styles.fullWidth}>Find match</Button>

        <Button style={styles.fullWidth} variant="secondary">
          Scan QR code
        </Button>

        <Button disabled focusableWhenDisabled style={styles.fullWidth}>
          In queue
        </Button>
      </div>
    </section>
  )
}

const styles = create({
  caption: {
    color: color.textSecondary,
    margin: 0,
  },
  column: {
    alignItems: 'flex-start',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  fixedWidth: {
    width: 211,
  },
  fullWidth: {
    width: '100%',
  },
  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 40,
  },
  heading: {
    margin: 0,
  },
  screen: {
    borderColor: color.textMuted,
    borderStyle: 'dashed',
    borderWidth: 1,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    maxWidth: 412,
    paddingBlock: 24,
    paddingInline: 24,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
})
