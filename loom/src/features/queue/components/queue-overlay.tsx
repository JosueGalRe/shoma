import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useQueue } from '@/features/queue'
import { formatTimer } from '../queue-utils'
import { queueOverlayStyles } from '../queue-styles'

export function QueueOverlay() {
  const { cancelQueue, dodgePenalty, isInQueue, isLoading, queueType, timer } = useQueue()
  const styles = queueOverlayStyles()

  if (!isInQueue) {
    return null
  }

  return (
    <div className={styles.overlay()}>
      <Card className={styles.card()}>
        <CardHeader className={styles.header()}>
          <div className={styles.emblem()}>
            ◈
          </div>
          <CardTitle className={styles.title()}>BUSCANDO PARTIDA</CardTitle>
          <p className={styles.subtitle()}>TIEMPO DE BÚSQUEDA</p>
          <p className={styles.timer()}>{formatTimer(timer)}</p>
        </CardHeader>

        <CardContent className={styles.content()}>
          <div className={styles.section()}>
            <div className={styles.sectionLabel()}>MODO DE JUEGO</div>
            <div className={styles.sectionValue()}>{queueType}</div>
            <p className={styles.sectionHint()}>Esperando una partida…</p>
          </div>

          {dodgePenalty > 0 ? (
            <div className={styles.penalty()}>
              Penalización por esquivar: {formatTimer(dodgePenalty)}
            </div>
          ) : null}

          <div className={styles.actions()}>
            <Button
              className={styles.cancelButton()}
              disabled={isLoading}
              onClick={() => {
                void cancelQueue()
              }}
              type='button'
              variant='destructive'
            >
              CANCELAR COLA
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
