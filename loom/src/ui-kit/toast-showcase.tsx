import { Button } from '@shoma/ui/button'
import { text } from '@shoma/ui/text'
import { useToast } from '@shoma/ui/use-toast'
import { create, props } from '@stylexjs/stylex'

// The Figma UI KIT "Snackbar" variants and the screens' messages; the toast shows at the bottom of the viewport
export function ToastShowcase() {
  const toast = useToast()

  return (
    <section {...props(styles.section)}>
      <h2 {...props(text.heading3, styles.heading)}>Toast</h2>

      <div {...props(styles.row)}>
        <Button
          variant="secondary"
          onClick={() => {
            toast.add({ title: 'Friend Request Sent Successfully', type: 'success' })
          }}
        >
          Success
        </Button>

        <Button
          variant="secondary"
          onClick={() => {
            toast.add({ action: { label: 'Retry', onClick: () => {} }, title: 'Could not send the invite', type: 'error' })
          }}
        >
          Error with action
        </Button>

        <Button
          variant="secondary"
          onClick={() => {
            toast.add({ title: 'Select a Champion first to select runes', type: 'info' })
          }}
        >
          Info
        </Button>
      </div>
    </section>
  )
}

const styles = create({
  heading: {
    margin: 0,
  },
  row: {
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
