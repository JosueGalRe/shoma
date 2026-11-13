import { useState } from 'react'

import { Tab, Tabs, TabsList, TabsPanel } from '@shoma/ui/tabs'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'

// The champ select tabs from the Figma: Champion/Cosmetics and Emote/Reactions
export function TabsShowcase() {
  const [tab, setTab] = useState('champion')

  return (
    <section {...props(styles.section)}>
      <h2 {...props(text.heading3, styles.heading)}>Tabs</h2>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <Tab value="champion">Champion</Tab>

          <Tab value="cosmetics">Cosmetics</Tab>
        </TabsList>

        <TabsPanel style={styles.panel} value="champion">
          Champion grid
        </TabsPanel>

        <TabsPanel style={styles.panel} value="cosmetics">
          Skins and wards
        </TabsPanel>
      </Tabs>

      <Tabs defaultValue="reactions">
        <TabsList>
          <Tab value="emote">Emote</Tab>

          <Tab value="reactions">Reactions</Tab>
        </TabsList>
      </Tabs>
    </section>
  )
}

const styles = create({
  heading: {
    margin: 0,
  },
  panel: {
    color: color.textSecondary,
    paddingBlock: 16,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
})
