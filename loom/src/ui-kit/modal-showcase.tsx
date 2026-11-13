import { useState } from 'react'

import { Button } from '@shoma/ui/button'
import { Modal } from '@shoma/ui/modal'
import { text } from '@shoma/ui/text'
import { create, props } from '@stylexjs/stylex'

// The champion swap request from the Figma's champ select
export function ModalShowcase() {
  const [open, setOpen] = useState(false)

  const close = () => {
    setOpen(false)
  }

  return (
    <section {...props(styles.section)}>
      <h2 {...props(text.heading3, styles.heading)}>Modal</h2>

      <div {...props(styles.row)}>
        <Button
          variant="secondary"
          onClick={() => {
            setOpen(true)
          }}
        >
          Swap request
        </Button>
      </div>

      <Modal open={open} title="Swap for Camille?" onOpenChange={setOpen}>
        <Button style={styles.fullWidth} onClick={close}>
          Accept
        </Button>

        <Button style={styles.fullWidth} variant="secondary" onClick={close}>
          Cancel
        </Button>
      </Modal>
    </section>
  )
}

const styles = create({
  fullWidth: {
    width: '100%',
  },
  heading: {
    margin: 0,
  },
  row: {
    display: 'flex',
    gap: 24,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
})
