import { Icon } from '@shoma/ui/icon'
import { IconButton } from '@shoma/ui/icon-button'
import { text } from '@shoma/ui/text'
import { create, props } from '@stylexjs/stylex'

// Mirrors the Figma UI KIT icon buttons, then the icons the screens actually use
export function IconButtonShowcase() {
  return (
    <section {...props(styles.section)}>
      <h2 {...props(text.heading3, styles.heading)}>IconButton</h2>

      <div {...props(styles.row)}>
        <IconButton aria-label="Chat" size="large">
          <Icon name="chat" size={32} />
        </IconButton>

        <IconButton aria-label="Chat">
          <Icon name="chat" />
        </IconButton>

        <IconButton aria-label="Chat" size="small">
          <Icon name="chat" />
        </IconButton>

        <IconButton aria-label="Chat" variant="filled">
          <Icon name="chat" />
        </IconButton>

        <IconButton aria-label="Chat" size="small" variant="filled">
          <Icon name="chat" />
        </IconButton>
      </div>

      <div {...props(styles.row)}>
        <IconButton aria-label="Back">
          <Icon name="arrow-left" />
        </IconButton>

        <IconButton aria-label="Close" size="small">
          <Icon name="close" />
        </IconButton>

        <IconButton aria-label="Sort" size="large">
          <Icon name="sort" size={32} />
        </IconButton>

        <IconButton aria-label="Send" size="large">
          <Icon name="send" size={32} />
        </IconButton>

        <IconButton aria-label="Edit" variant="filled">
          <Icon name="edit" />
        </IconButton>

        <IconButton aria-label="Send" disabled size="large">
          <Icon name="send" size={32} />
        </IconButton>

        <IconButton aria-label="Edit" disabled variant="filled">
          <Icon name="edit" />
        </IconButton>
      </div>
    </section>
  )
}

const styles = create({
  heading: {
    margin: 0,
  },
  row: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 24,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
})
