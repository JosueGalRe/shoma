import { useState } from 'react'

import { BottomSheet } from '@shoma/ui/bottom-sheet'
import { Button } from '@shoma/ui/button'
import { text } from '@shoma/ui/text'
import { TextField } from '@shoma/ui/text-field'
import { create, props } from '@stylexjs/stylex'

// The Figma UI KIT "Bottom Sheet" plus the two sheets of the Social screens: "Options" (short) and "Add Friend" (tall)
export function BottomSheetShowcase() {
  const [open, setOpen] = useState<'add-friend' | 'kit' | 'options' | null>(null)
  const [gameName, setGameName] = useState('')
  const [tagLine, setTagLine] = useState('')

  const sheetProps = (sheet: 'add-friend' | 'kit' | 'options') => {
    return {
      onOpenChange: (next: boolean) => {
        setOpen(next ? sheet : null)
      },
      open: open === sheet,
    }
  }

  return (
    <section {...props(styles.section)}>
      <h2 {...props(text.heading3, styles.heading)}>BottomSheet</h2>

      <div {...props(styles.row)}>
        <Button
          variant="secondary"
          onClick={() => {
            setOpen('kit')
          }}
        >
          UI kit
        </Button>

        <Button
          variant="secondary"
          onClick={() => {
            setOpen('options')
          }}
        >
          Options
        </Button>

        <Button
          variant="secondary"
          onClick={() => {
            setOpen('add-friend')
          }}
        >
          Add friend
        </Button>
      </div>

      <BottomSheet description="Here you can have text" title="Title" {...sheetProps('kit')}>
        {null}
      </BottomSheet>

      <BottomSheet closeLabel="Back" title="Options" {...sheetProps('options')}>
        <p {...props(text.body1, styles.option)}>Sort Alphabetically</p>

        <p {...props(text.body1, styles.option)}>Sort by Status</p>

        <p {...props(text.body1, styles.option)}>Group Offline</p>
      </BottomSheet>

      <BottomSheet closeLabel="Back" style={styles.tall} title="Add Friend" {...sheetProps('add-friend')}>
        <TextField label="Game name" placeholder="Type game name" value={gameName} onValueChange={setGameName} />

        <TextField label="Tag line" placeholder="#" value={tagLine} onValueChange={setTagLine} />

        <Button disabled={gameName === '' || tagLine === ''} style={styles.fullWidth}>
          Add friend
        </Button>
      </BottomSheet>
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
  option: {
    margin: 0,
    paddingBlock: 5,
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
  // Add Friend fills the screen below the status bar in the Figma
  tall: {
    height: 'calc(100dvh - 72px + 48px)',
  },
})
