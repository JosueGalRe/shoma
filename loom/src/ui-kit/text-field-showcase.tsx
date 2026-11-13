import { useState } from 'react'

import { text } from '@shoma/ui/text'
import { TextField } from '@shoma/ui/text-field'
import { create, props } from '@stylexjs/stylex'

// Mirrors the Figma UI KIT "Text Fields" frame (default, typed, disabled; error on the right), then the screens' uses
export function TextFieldShowcase() {
  const [typed, setTyped] = useState('input text')
  const [search, setSearch] = useState('')
  const [gameName, setGameName] = useState('')
  const [tagLine, setTagLine] = useState('')

  return (
    <section {...props(styles.section)}>
      <h2 {...props(text.heading3, styles.heading)}>TextField</h2>

      <div {...props(styles.grid)}>
        <TextField
          clearLabel="Clear"
          description="We'll never share it."
          label="Label"
          placeholder="input text"
          style={styles.fixedWidth}
          value=""
          onValueChange={() => {}}
        />

        <TextField
          clearLabel="Clear"
          error="We'll never share it."
          label="Label"
          placeholder="input text"
          style={styles.fixedWidth}
          value=""
          onValueChange={() => {}}
        />

        <TextField
          clearLabel="Clear"
          description="We'll never share it."
          label="Label"
          style={styles.fixedWidth}
          value={typed}
          onValueChange={setTyped}
        />

        <TextField
          clearLabel="Clear"
          error="We'll never share it."
          label="Label"
          style={styles.fixedWidth}
          value={typed}
          onValueChange={setTyped}
        />

        <TextField
          disabled
          description="We'll never share it."
          label="Label"
          style={styles.fixedWidth}
          value="input text"
          onValueChange={() => {}}
        />
      </div>

      <div {...props(styles.screen)}>
        <TextField aria-label="Search" clearLabel="Clear" placeholder="Search" value={search} onValueChange={setSearch} />

        <TextField label="Game name" placeholder="Type game name" value={gameName} onValueChange={setGameName} />

        <TextField label="Tag line" placeholder="#" value={tagLine} onValueChange={setTagLine} />
      </div>
    </section>
  )
}

const styles = create({
  fixedWidth: {
    width: 280,
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
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    maxWidth: 364,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
})
