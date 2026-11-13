import { IconButton } from '@shoma/ui/icon-button'
import { text } from '@shoma/ui/text'
import { create, props } from '@stylexjs/stylex'
import { ArrowLeft, ArrowUpDown, MessageSquare, Pencil, Send, X } from 'lucide-react'

// Mirrors the Figma UI KIT icon buttons, then the icons the screens actually use
export function IconButtonShowcase() {
  return (
    <section {...props(styles.section)}>
      <h2 {...props(text.heading3, styles.heading)}>IconButton</h2>

      <div {...props(styles.row)}>
        <IconButton aria-label="Chat" size="large">
          <MessageSquare />
        </IconButton>

        <IconButton aria-label="Chat">
          <MessageSquare />
        </IconButton>

        <IconButton aria-label="Chat" size="small">
          <MessageSquare />
        </IconButton>

        <IconButton aria-label="Chat" variant="filled">
          <MessageSquare fill="currentColor" />
        </IconButton>

        <IconButton aria-label="Chat" size="small" variant="filled">
          <MessageSquare fill="currentColor" />
        </IconButton>
      </div>

      <div {...props(styles.row)}>
        <IconButton aria-label="Back">
          <ArrowLeft />
        </IconButton>

        <IconButton aria-label="Close" size="small">
          <X />
        </IconButton>

        <IconButton aria-label="Sort" size="large">
          <ArrowUpDown />
        </IconButton>

        <IconButton aria-label="Send" size="large">
          <Send />
        </IconButton>

        <IconButton aria-label="Edit" variant="filled">
          <Pencil />
        </IconButton>

        <IconButton aria-label="Send" disabled size="large">
          <Send />
        </IconButton>

        <IconButton aria-label="Edit" disabled variant="filled">
          <Pencil />
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
