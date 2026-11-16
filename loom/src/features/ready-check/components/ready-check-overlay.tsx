import { Fragment } from 'react'

import { Button } from '@shoma/ui/button'
import { FadeImage } from '@shoma/ui/fade-image'
import { Modal } from '@shoma/ui/modal'
import { text } from '@shoma/ui/text'
import { create, props } from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { createLcuQueryOptions, gameflowPhaseDescriptor, lobbySessionDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'
import { useLobbyQueueArt } from '@/features/lobby/hooks/use-lobby-queue-art'

import { useReadyCheck } from '../hooks/use-ready-check'
import { formatMatchup } from '../ready-check-utils'

import { ReadyCheckRing } from './ready-check-ring'

// Figma "Looby/ Match Found" (309:60083), drawn for ARAM but the same for every queue: the map's ready-check art, the
// Countdown ring around the mode's icon, then map, queue and matchup. It stays up once accepted, as in the client,
// Until the match starts or someone declines
export function ReadyCheckOverlay() {
  const { accept, decline, elapsedSeconds, isResponding, status } = useReadyCheck()
  const { t } = useTranslation()
  const transport = useSharedLCUTransport()
  const gameflowQuery = useQuery(createLcuQueryOptions(gameflowPhaseDescriptor, transport))
  const lobbySessionQuery = useQuery(createLcuQueryOptions(lobbySessionDescriptor, transport))
  const { description, iconUrl, mapName, playersPerTeam, readyCheckUrl } = useLobbyQueueArt(
    lobbySessionQuery.data?.queueId ?? null,
  )
  const isAccepted = status === 'accepted'
  const isOpen = (status === 'pending' || isAccepted) && gameflowQuery.data === 'ReadyCheck'
  const matchup = formatMatchup(playersPerTeam)
  const details = [mapName, description, matchup].filter((detail) => {
    return Boolean(detail)
  })

  return (
    <Modal
      open={isOpen}
      style={readyCheckUrl ? styles.art(`url("${readyCheckUrl}")`) : undefined}
      title={
        <ReadyCheckRing elapsedSeconds={elapsedSeconds}>
          {iconUrl ? <FadeImage src={iconUrl} style={styles.icon} /> : null}

          <span>{t('readyCheck.matchFound')}</span>
        </ReadyCheckRing>
      }
      description={
        details.length > 0 ? (
          <span {...props(text.marcellus11, styles.details)}>
            {details.map((detail, index) => {
              return (
                <Fragment key={detail}>
                  {index > 0 ? <span aria-hidden {...props(styles.dot)} /> : null}

                  <span {...props(detail === matchup && styles.matchup)}>{detail}</span>
                </Fragment>
              )
            })}
          </span>
        ) : undefined
      }
      // A decision only the buttons make, so Escape doesn't close it
      onOpenChange={() => {}}
    >
      <Button
        disabled={isAccepted || isResponding}
        style={styles.fullWidth}
        onClick={() => {
          void accept()
        }}
      >
        {isAccepted ? t('readyCheck.accepted') : t('readyCheck.accept')}
      </Button>

      <Button
        disabled={isResponding}
        style={styles.fullWidth}
        variant="secondary"
        onClick={() => {
          void decline()
        }}
      >
        {t('readyCheck.decline')}
      </Button>
    </Modal>
  )
}

const styles = create({
  // The Figma's map art at 75% over white, under the panel's gradient. The client's art is a disc, so it's drawn at
  // 150% of the panel's width for the disc to reach its corners
  // eslint-disable-next-line arrow-body-style
  art: (image: string) => ({
    backgroundImage: `linear-gradient(rgb(45 81 92 / 70%), rgb(5 16 25 / 70%) 69%), linear-gradient(rgb(255 255 255 / 25%), rgb(255 255 255 / 25%)), ${image}`,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '100% 100%, 100% 100%, 150% auto',
  }),
  details: {
    alignItems: 'center',
    columnGap: 16,
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    letterSpacing: '0.06em',
    rowGap: 4,
    textTransform: 'uppercase',
  },
  dot: {
    backgroundColor: 'currentColor',
    borderRadius: '50%',
    flexShrink: 0,
    height: 4,
    width: 4,
  },
  fullWidth: {
    width: '100%',
  },
  icon: {
    height: 40,
    objectFit: 'contain',
    width: 40,
  },
  // The Figma writes the names in capitals but keeps "5vs5" as is
  matchup: {
    textTransform: 'none',
  },
})
