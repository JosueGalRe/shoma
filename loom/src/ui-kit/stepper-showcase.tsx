import { useState } from 'react'

import { Button } from '@shoma/ui/button'
import { Stepper } from '@shoma/ui/stepper'
import { text } from '@shoma/ui/text'
import { create, props } from '@stylexjs/stylex'

// The create-lobby flow's three steps: category, mode, game type
export function StepperShowcase() {
  const [step, setStep] = useState(1)

  return (
    <section {...props(styles.section)}>
      <h2 {...props(text.heading3, styles.heading)}>Stepper</h2>

      <Stepper aria-label="Create lobby" aria-valuetext={`Step ${step} of 3`} step={step} />

      <div {...props(styles.row)}>
        <Button
          disabled={step === 1}
          variant="secondary"
          onClick={() => {
            setStep(step - 1)
          }}
        >
          Back
        </Button>

        <Button
          disabled={step === 3}
          onClick={() => {
            setStep(step + 1)
          }}
        >
          Next
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
    gap: 16,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
})
