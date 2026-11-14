import { useState } from 'react'

import { Button } from '@shoma/ui/button'
import { Loader } from '@shoma/ui/loader'
import { ScreenBackground } from '@shoma/ui/screen-background'
import { text } from '@shoma/ui/text'
import { create, props } from '@stylexjs/stylex'

// Stand-in for the map art the dashboard and lobby put behind the screen
const art = 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ahri_0.jpg'

// The Loader of the pairing screen, and the screen background this whole catalog sits on: plain (connect, social)
// Or over map art (dashboard, lobby, champ select)
export function BackgroundShowcase() {
  const [withArt, setWithArt] = useState(false)

  return (
    <section {...props(styles.section)}>
      <ScreenBackground image={withArt ? art : undefined} />

      <h2 {...props(text.heading3, styles.heading)}>Loader, ScreenBackground</h2>

      <Loader aria-label="Connecting" />

      <div>
        <Button
          variant="secondary"
          onClick={() => {
            setWithArt(!withArt)
          }}
        >
          {withArt ? 'Plain background' : 'Background with art'}
        </Button>
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
})
