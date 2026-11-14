import { BottomNav, BottomNavTab } from '@shoma/ui/bottom-nav'
import { Icon } from '@shoma/ui/icon'
import { Tabs, TabsPanel } from '@shoma/ui/tabs'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'

const sections = [
  { icon: <Icon name="champion" />, label: 'Champion', value: 'champion' },
  { icon: <Icon name="spell" />, label: 'Spell', value: 'spell' },
  { icon: <Icon name="dashboard" />, label: 'Picks', value: 'picks' },
  { icon: <Icon name="rune" />, label: 'Rune', value: 'rune' },
  { icon: <Icon name="sentinel" />, label: 'Wards', value: 'wards' },
]

// Champ select's sections in Summoner's Rift draft
export function BottomNavShowcase() {
  return (
    <section {...props(styles.section)}>
      <h2 {...props(text.heading3, styles.heading)}>BottomNav</h2>

      <Tabs defaultValue="champion" style={styles.screen}>
        {sections.map(({ label, value }) => {
          return (
            <TabsPanel key={value} style={styles.panel} value={value}>
              {`${label} section`}
            </TabsPanel>
          )
        })}

        <BottomNav aria-label="Champ select">
          {sections.map(({ icon, label, value }) => {
            return (
              <BottomNavTab key={value} icon={icon} value={value}>
                {label}
              </BottomNavTab>
            )
          })}
        </BottomNav>
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
    paddingBlock: 24,
  },
  // Full bleed like the Figma's 412px bar
  screen: {
    marginInline: -24,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
})
