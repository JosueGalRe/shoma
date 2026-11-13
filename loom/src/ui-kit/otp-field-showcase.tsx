import { useState } from 'react'

import { OtpField } from '@shoma/ui/otp-field'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'

// Mirrors the Figma UI KIT "Segmented Input" frame, then the pairing screen with its invalid-code error
export function OtpFieldShowcase() {
  const [code, setCode] = useState('')
  const [invalidCode, setInvalidCode] = useState('124155')

  return (
    <section {...props(styles.section)}>
      <h2 {...props(text.heading3, styles.heading)}>OtpField</h2>

      <div {...props(styles.grid)}>
        <OtpField label="Code" length={6} value={code} onValueChange={setCode} />

        <OtpField disabled label="Code" length={6} value="124155" />
      </div>

      <div {...props(styles.screen)}>
        <p id="pairing-instructions" {...props(text.body2, styles.instructions)}>
          Enter your 6-digit code from your Conduit Web App
        </p>

        <OtpField
          aria-labelledby="pairing-instructions"
          error="Invalid Code. Please make sure you are entering the correct code"
          length={6}
          value={invalidCode}
          onValueChange={setInvalidCode}
        />
      </div>
    </section>
  )
}

const styles = create({
  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 40,
  },
  heading: {
    margin: 0,
  },
  instructions: {
    color: color.text,
    margin: 0,
    textAlign: 'center',
  },
  screen: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 32,
    maxWidth: 364,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
})
