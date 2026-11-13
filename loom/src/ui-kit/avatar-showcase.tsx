import { Avatar } from '@shoma/ui/avatar'
import { text } from '@shoma/ui/text'
import { create, props } from '@stylexjs/stylex'

const icon = (id: number) => {
  return `https://ddragon.leagueoflegends.com/cdn/14.24.1/img/profileicon/${id}.png`
}

// The Social list rows, the chat header's small avatar, the lobby's large one, and the initials fallback
export function AvatarShowcase() {
  return (
    <section {...props(styles.section)}>
      <h2 {...props(text.heading3, styles.heading)}>Avatar</h2>

      <div {...props(styles.list)}>
        <Avatar image={icon(588)} name="Bryan Galdamez" online status="En partida" />

        <Avatar image={icon(4568)} name="Dylan Siliezar" status="Desconectado" />
      </div>

      <div {...props(styles.row)}>
        <Avatar image={icon(588)} name="Bryan Galdamez" online size="small" />

        <Avatar image={icon(588)} name="Bryan Galdamez" size="large" />

        <Avatar name="Ana Rivera" online />

        <Avatar image="https://ddragon.leagueoflegends.com/missing.png" name="Paola Carias" size="large" />
      </div>
    </section>
  )
}

const styles = create({
  heading: {
    margin: 0,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  row: {
    alignItems: 'center',
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
