import { useState } from 'react'

import { EmptySlot } from '@shoma/ui/empty-slot'
import { RoundTile } from '@shoma/ui/round-tile'
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

const perks = 'https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles'

const paths = [
  { file: '7201_Precision', name: 'Precision' },
  { file: '7200_Domination', name: 'Domination' },
  { file: '7202_Sorcery', name: 'Sorcery' },
  { file: '7204_Resolve', name: 'Resolve' },
  { file: '7203_Whimsy', name: 'Inspiration' },
]

const keystones = [
  { file: 'PressTheAttack/PressTheAttack', name: 'Press the Attack' },
  { file: 'LethalTempo/LethalTempoTemp', name: 'Lethal Tempo' },
  { file: 'FleetFootwork/FleetFootwork', name: 'Fleet Footwork' },
  { file: 'Conqueror/Conqueror', name: 'Conqueror' },
]

const skins = [
  { id: 0, name: 'Jinx' },
  { id: 1, name: 'Mafia Jinx' },
  { id: 4, name: 'Firecracker Jinx' },
].map(({ id, name }) => {
  return { id: `Jinx_${id}`, image: `${cdn}/img/champion/splash/Jinx_${id}.jpg`, name }
})

// Champ select's champion grid, spell picker and skins; the rune editor's paths and keystones; the lobby's empty slots.
// The slot icons are lucide stand-ins until the Figma's own icons are exported.
export function SlotsShowcase() {
  const [champion, setChampion] = useState(['Jinx'])
  const [picked, setPicked] = useState(['SummonerFlash'])
  const [skin, setSkin] = useState(['Jinx_0'])
  const [path, setPath] = useState(['Precision'])
  const [keystone, setKeystone] = useState(['Conqueror'])
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

      <TileGroup aria-label="Primary path" style={styles.pathRow} value={path} onValueChange={setPath}>
        {paths.map(({ file, name }) => {
          return <RoundTile key={name} image={`${perks}/${file}.png`} label={name} size="medium" value={name} />
        })}
      </TileGroup>

      <TileGroup aria-label="Keystone" style={styles.keystoneRow} value={keystone} onValueChange={setKeystone}>
        {keystones.map(({ file, name }) => {
          return (
            <RoundTile
              key={name}
              image={`${perks}/Precision/${file}.png`}
              infoLabel={`${name} details`}
              label={name}
              size="small"
              value={name}
              onInfoClick={() => {
                setInfo(name)
              }}
            />
          )
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
  keystoneRow: {
    gap: 32,
    paddingBlock: 8,
    paddingInlineStart: 48,
  },
  pathRow: {
    gap: 0,
    justifyContent: 'space-between',
    paddingBlock: 8,
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
