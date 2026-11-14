import type { ReactNode } from 'react'

import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { communityDragonGameDataUrl, useChampions, useRunes } from '@/core/http/ddragon'
import { readQuickPlayKeystone, readRole } from '@/core/lcu/parsers/lobby'
import { createLcuQueryOptions, summonerSpellsDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'
import { ROLE_ICONS } from '@/features/lobby/role-icons'
import { getChampionName, getPerkName, getSpellName, resolvePerkIcon, resolveSpellIcon } from '@/lib/asset-resolver'

import { LobbySlot } from './lobby-slot'

import type { LobbyQuickPlaySlotsProps } from './lobby-screen-types'
import type { QuickPlayPart } from '@/features/lobby/utils/quick-play-slots'

interface SlotPart {
  content: ReactNode
  label: string
  option: 0 | 1
  part: QuickPlayPart
}

const OPTIONS = [0, 1] as const
const SPELL_SLOTS = ['first', 'second'] as const
// Figma's 80px places, down to 52 on a 667px-tall screen so the rows and the party switch fit over the bottom action
const SLOT_SIZE = 'clamp(48px, 12dvh - 28px, 80px)'
const SPELL_SIZE = `calc((${SLOT_SIZE} - 4px) / 2)`

// Figma Swift Play "Selection": a member's two options side by side, each its champion, position, two spells and keystone.
// The local player taps a part to pick it
export function LobbyQuickPlaySlots({ onEdit, slots }: LobbyQuickPlaySlotsProps) {
  const { t } = useTranslation()
  const transport = useSharedLCUTransport()
  const spells = useQuery(createLcuQueryOptions(summonerSpellsDescriptor, transport)).data ?? []
  const runes = useRunes().data ?? []
  const champions = useChampions().data ?? []

  function renderPart({ content, label, option, part }: SlotPart) {
    if (!onEdit) {
      return (
        <div key={part} role="img" aria-label={label} {...props(styles.part)}>
          {content}
        </div>
      )
    }

    return (
      <button
        key={part}
        aria-label={label}
        type="button"
        onClick={() => {
          onEdit(option, part)
        }}
        {...props(styles.part, styles.button)}
      >
        {content}
      </button>
    )
  }

  // D and F, each its own place: tapping one opens the spells on that key, as a role tile opens Select Position on its slot
  function renderSpells(option: 0 | 1, spellIds: readonly [number, number]) {
    const none = t('lobby.quickPlay.none')
    const names = spellIds.map((spellId) => {
      return spellId > 0 ? (getSpellName(spellId, spells) ?? String(spellId)) : none
    })
    const icons = spellIds.map((spellId, index) => {
      return (
        <LobbySlot
          key={SPELL_SLOTS[index]}
          image={spellId > 0 ? resolveSpellIcon(spellId, spells) : undefined}
          picked={spellId > 0}
          size="small"
          style={styles.spell}
        />
      )
    })

    if (!onEdit) {
      return (
        <div
          key="spells"
          role="img"
          aria-label={`${t('lobby.quickPlay.spells')}: ${names.join(', ')}`}
          {...props(styles.part, styles.spells)}
        >
          {icons}
        </div>
      )
    }

    return (
      <div key="spells" {...props(styles.part, styles.spells)}>
        {SPELL_SLOTS.map((spellSlot, index) => {
          return (
            <button
              key={spellSlot}
              aria-label={`${t(spellSlot === 'first' ? 'lobby.quickPlay.spellD' : 'lobby.quickPlay.spellF')}: ${names[index]}`}
              type="button"
              onClick={() => {
                onEdit(option, 'spells', spellSlot)
              }}
              {...props(styles.part, styles.button)}
            >
              {icons[index]}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div {...props(styles.root)}>
      {OPTIONS.map((option) => {
        const slot = slots[option]
        const championId = slot?.championId ?? 0
        const role = readRole(slot?.positionPreference)
        const keystoneId = slot ? readQuickPlayKeystone(slot.perks) : null
        const none = t('lobby.quickPlay.none')

        return (
          <div
            key={option}
            role="group"
            aria-label={t('lobby.quickPlay.option', { number: option + 1 })}
            {...props(styles.option)}
          >
            {[
              {
                content: (
                  <LobbySlot
                    icon="champion"
                    style={styles.slot}
                    image={
                      championId > 0
                        ? communityDragonGameDataUrl(`/lol-game-data/assets/v1/champion-icons/${championId}.png`)
                        : undefined
                    }
                    picked={championId > 0}
                  />
                ),
                label: `${t('lobby.quickPlay.champion')}: ${(championId > 0 && getChampionName(championId, champions)) || none}`,
                option,
                part: 'champion' as const,
              },
              {
                content: <LobbySlot icon={ROLE_ICONS[role]} picked={role !== 'UNSELECTED'} style={styles.slot} />,
                label: `${t('lobby.quickPlay.position')}: ${role === 'UNSELECTED' ? none : t(`lobby.roles.${role.toLowerCase()}`)}`,
                option,
                part: 'position' as const,
              },
            ].map(renderPart)}

            {renderSpells(option, [slot?.spell1 ?? 0, slot?.spell2 ?? 0])}

            {renderPart({
              content: (
                <LobbySlot
                  icon="rune"
                  style={styles.slot}
                  image={keystoneId === null ? undefined : resolvePerkIcon(keystoneId, runes)}
                  picked={keystoneId !== null}
                />
              ),
              label: `${t('lobby.quickPlay.rune')}: ${(keystoneId !== null && getPerkName(keystoneId, runes)) || none}`,
              option,
              part: 'rune',
            })}
          </div>
        )
      })}
    </div>
  )
}

const styles = create({
  button: {
    WebkitTapHighlightColor: 'transparent',
    backgroundColor: 'transparent',
    borderWidth: 0,
    cursor: 'pointer',
    outlineColor: color.focusRing,
    outlineOffset: 2,
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: 2,
    padding: 0,
    touchAction: 'manipulation',
  },
  // Figma: a 96 wide column with 8 around, 15 between its places
  option: {
    backgroundColor: color.sheet,
    display: 'flex',
    flexDirection: 'column',
    gap: 'clamp(8px, 2.4dvh - 7px, 15px)',
    padding: 8,
  },
  part: {
    display: 'block',
    margin: 0,
  },
  root: {
    display: 'flex',
    gap: 16,
    marginBlockStart: 'clamp(12px, 4.8dvh - 20px, 24px)',
  },
  slot: {
    height: SLOT_SIZE,
    width: SLOT_SIZE,
  },
  spell: {
    height: SPELL_SIZE,
    width: SPELL_SIZE,
  },
  spells: {
    display: 'flex',
    gap: 4,
  },
})
