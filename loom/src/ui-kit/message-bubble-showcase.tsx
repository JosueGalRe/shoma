import { MessageBubble } from '@shoma/ui/message-bubble'
import { text } from '@shoma/ui/text'
import { create, props } from '@stylexjs/stylex'

// A Social chat thread: the friend's messages on the left, yours on the right
export function MessageBubbleShowcase() {
  return (
    <section {...props(styles.section)}>
      <h2 {...props(text.heading3, styles.heading)}>MessageBubble</h2>

      <div {...props(styles.thread)}>
        <MessageBubble variant="received">This is a message</MessageBubble>

        <MessageBubble variant="sent">This is a message</MessageBubble>

        <MessageBubble variant="received">
          A longer message wraps at three quarters of the thread, so the sides stay readable on a phone.
        </MessageBubble>
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
  thread: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
})
