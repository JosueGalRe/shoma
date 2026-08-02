import { readyCheckOverlayStyles } from '../ready-check-styles'

export function ReadyCheckBackdrop() {
  const styles = readyCheckOverlayStyles()

  return (
    <>
      <div className={styles.particles()}>
        <div
          className={styles.particle1()}
          style={{ animation: 'particle-drift-1 8s infinite ease-in-out, pulse 2s infinite' }}
        />

        <div
          className={styles.particle2()}
          style={{ animation: 'particle-drift-2 12s infinite ease-in-out, pulse 3s infinite' }}
        />

        <div
          className={styles.particle3()}
          style={{ animation: 'particle-drift-3 10s infinite ease-in-out, pulse 4s infinite' }}
        />

        <div
          className={styles.particle4()}
          style={{ animation: 'particle-drift-4 9s infinite ease-in-out, pulse 2.5s infinite' }}
        />
      </div>

      <div className={styles.rings()}>
        <div className={styles.outerRing()} style={{ animation: 'ring-pulse-outer 4s infinite ease-in-out' }} />

        <div className={styles.rotatingRing()} style={{ animation: 'ring-rotate 20s linear infinite' }} />
      </div>
    </>
  )
}
