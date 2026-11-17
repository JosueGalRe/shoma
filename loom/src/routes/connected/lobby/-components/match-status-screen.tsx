import { ScreenBackground } from '@shoma/ui/screen-background'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'

import { TopBar } from '@/components/layout/top-bar'
import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import { createLcuQueryOptions, gameflowQueueDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'
import { useLobbyQueueArt } from '@/features/lobby/hooks/use-lobby-queue-art'

import type { MatchStatusScreenProps } from './lobby-screen-types'

// Figma "Match in progress/finalized" (451:39005): one line over the game's map art while it runs and once it ends
export function MatchStatusScreen({ message, onBack }: MatchStatusScreenProps) {
  const transport = useSharedLCUTransport()
  // The game's queue: the client deletes the lobby when the game starts
  const queueQuery = useQuery(createLcuQueryOptions(gameflowQueueDescriptor, transport))
  const { backgroundUrl } = useLobbyQueueArt(queueQuery.data?.id ?? null)

  useLcuObserverSync(gameflowQueueDescriptor, transport)

  return (
    <div {...props(styles.screen)}>
      <ScreenBackground image={backgroundUrl} />

      <TopBar onBack={onBack} />

      <main {...props(styles.content)}>
        <h1 {...props(text.heading2, styles.message)}>{message}</h1>
      </main>
    </div>
  )
}

const styles = create({
  content: {
    alignItems: 'center',
    display: 'flex',
    flexGrow: 1,
    justifyContent: 'center',
    // The Figma centers the line on the screen, not under the top bar
    paddingBlockEnd: 88,
    paddingInline: 24,
  },
  message: {
    color: color.text,
    margin: 0,
    textAlign: 'center',
  },
  screen: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minHeight: 0,
  },
})
