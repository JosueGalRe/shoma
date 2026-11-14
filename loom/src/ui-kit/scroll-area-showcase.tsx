import { ScrollArea } from '@shoma/ui/scroll-area'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'

const rows = Array.from({ length: 20 }, (_, index) => {
  return `Row ${index + 1}`
})

// Not in the Figma: the scroll every long screen uses, its thumb shows while scrolling or hovering
export function ScrollAreaShowcase() {
  return (
    <section {...props(styles.section)}>
      <h2 {...props(text.heading3, styles.heading)}>ScrollArea</h2>

      <ScrollArea contentStyle={styles.content} style={styles.box}>
        {rows.map((row) => {
          return (
            <p key={row} {...props(text.body2, styles.row)}>
              {row}
            </p>
          )
        })}
      </ScrollArea>
    </section>
  )
}

const styles = create({
  box: {
    borderColor: color.border,
    borderStyle: 'solid',
    borderWidth: 1,
    height: 200,
    maxWidth: 328,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: 16,
  },
  heading: {
    margin: 0,
  },
  row: {
    color: color.text,
    margin: 0,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
})
