import { useState } from 'react'

import { EmptySlot } from '@shoma/ui/empty-slot'
import { text } from '@shoma/ui/text'
import { Tile, TileGroup } from '@shoma/ui/tile'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { Plus, Shield, Sparkles } from 'lucide-react'

const cdn = 'https://ddragon.leagueoflegends.com/cdn'
const version = '14.24.1'

const champions = ['Ahri', 'Camille', 'Jinx', 'Viktor', 'Lux', 'Thresh'].map((id) => {
  return { id, image: `${cdn}/${version}/img/champion/${id}.png` }
})

const spellIds: Record<string, string> = { Cleanse: 'SummonerBoost', Ghost: 'SummonerHaste', Ignite: 'SummonerDot' }

const spells = ['Flash', 'Ghost', 'Heal', 'Barrier', 'Exhaust', 'Teleport', 'Ignite', 'Cleanse'].map((name) => {
  const id = spellIds[name] ?? `Summoner${name}`

  return { id, image: `${cdn}/${version}/img/spell/${id}.png`, name }
})

const skins = [
  { id: 0, name: 'Jinx' },
  { id: 1, name: 'Mafia Jinx' },
  { id: 4, name: 'Firecracker Jinx' },
].map(({ id, name }) => {
  return { id: `Jinx_${id}`, image: `${cdn}/img/champion/splash/Jinx_${id}.jpg`, name }
})

// Champ select's champion grid and spell picker, the skin tiles, and the lobby's empty slots.
// The slot icons are lucide stand-ins until the Figma's own icons are exported.
export function SlotsShowcase() {
  const [champion, setChampion] = useState(['Jinx'])
  const [picked, setPicked] = useState(['SummonerFlash'])
  const [skin, setSkin] = useState(['Jinx_0'])
  const [info, setInfo] = useState('')

  return (
    <section {...props(styles.section)}>
      <h2 {...props(text.heading3, styles.heading)}>Tile, EmptySlot</h2>

      <TileGroup aria-label="Champion" style={styles.championGrid} value={champion} onValueChange={setChampion}>
        {champions.map(({ id, image }) => {
          return <Tile key={id} disabled={id === 'Thresh'} image={image} label={id} value={id} />
        })}
      </TileGroup>

      <TileGroup
        aria-label="Summoner spells"
        multiple
        style={styles.spellGrid}
        value={picked}
        onValueChange={(next) => {
          if (next.length <= 2) {
            setPicked(next)
          }
        }}
      >
        {spells.map(({ id, image, name }) => {
          return (
            <Tile
              key={id}
              image={image}
              infoLabel={`${name} details`}
              onInfoClick={() => {
                setInfo(name)
              }}
              label={name}
              value={id}
            />
          )
        })}
      </TileGroup>

      <p {...props(text.body1, styles.caption)}>{`${picked.length} out of 2${info ? ` · info: ${info}` : ''}`}</p>

      <TileGroup aria-label="Skin" style={styles.skinGrid} value={skin} onValueChange={setSkin}>
        {skins.map(({ id, image, name }) => {
          return <Tile key={id} image={image} label={name} size="large" value={id} />
        })}
      </TileGroup>

      <div {...props(styles.row)}>
        <EmptySlot aria-label="Pick a champion" icon={<Shield />} />

        <EmptySlot aria-label="Pick a spell" icon={<Sparkles size={16} />} style={styles.small} />

        <EmptySlot aria-label="Teammate's champion" disabled icon={<Shield />} />

        <EmptySlot aria-label="Invite a friend" icon={<Plus />} variant="friend" />

        <EmptySlot aria-label="Invite a friend" icon={<Plus size={20} />} style={styles.small} variant="friend" />
      </div>
    </section>
  )
}

const styles = create({
  caption: {
    color: color.text,
    margin: 0,
  },
  championGrid: {
    display: 'grid',
    gap: 16,
    gridTemplateColumns: 'repeat(3, 80px)',
    justifyContent: 'center',
    paddingBlock: 8,
  },
  heading: {
    margin: 0,
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
  skinGrid: {
    display: 'grid',
    gap: 16,
    gridTemplateColumns: 'repeat(2, 175px)',
    paddingBlock: 8,
  },
  small: {
    height: 40,
    width: 40,
  },
  spellGrid: {
    display: 'grid',
    gap: 15,
    gridTemplateColumns: 'repeat(4, 80px)',
    paddingBlock: 8,
  },
})
