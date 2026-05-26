/* eslint-disable react-doctor/no-long-transition-duration -- All transitions are intentional cinematic animations (2s–20s) for the ready-check overlay */
import { useEffect, useRef } from 'react'

import { useQuery } from '@tanstack/react-query'

import { createLcuQueryOptions, gameflowPhaseDescriptor } from '@/core/lcu/lcu-queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'

import { useReadyCheck } from '../hooks/use-ready-check'
import { readyCheckOverlayStyles } from '../ready-check-styles'
import { formatTimer } from '../ready-check-utils'

export function ReadyCheckOverlay() {
  const { accept, decline, error, isLoading, status, timer } = useReadyCheck()
  const transport = useSharedLCUTransport()
  const gameflowQuery = useQuery(createLcuQueryOptions(gameflowPhaseDescriptor, transport))
  const previousBodyOverflowRef = useRef<string | null>(null)
  const isVisible = status === 'pending' && gameflowQuery.data === 'ReadyCheck'
  const isUrgent = timer <= 5
  const hasResponded = status !== 'pending'
  const styles = readyCheckOverlayStyles({ blocked: hasResponded || isLoading, urgent: isUrgent })

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined
    }

    if (!isVisible) {
      return undefined
    }

    previousBodyOverflowRef.current = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousBodyOverflowRef.current ?? ''
    }
  }, [isVisible])

  if (!isVisible) {
    return null
  }

  return (
    <div role="dialog" className={styles.overlay()} data-testid="ready-check-overlay" aria-modal="true">
      <div className={styles.scrim()} />

      <style>{`
        @keyframes modal-entrance {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes subtitle-entrance {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scrim-entrance {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes ring-pulse-outer {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.02); }
        }
        @keyframes ring-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes ring-pulse-inner {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes timer-glow {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(200,170,110,0.3)); }
          50% { filter: drop-shadow(0 0 40px rgba(200,170,110,0.6)); }
        }
        @keyframes button-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes border-travel {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes shimmer-continuous {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes particle-drift-1 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(20px, -30px); }
          50% { transform: translate(-10px, -50px); }
          75% { transform: translate(30px, -20px); }
        }
        @keyframes particle-drift-2 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(-25px, -40px); }
          66% { transform: translate(15px, -60px); }
        }
        @keyframes particle-drift-3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -40px); }
        }
        @keyframes particle-drift-4 {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(-20px, -25px); }
          40% { transform: translate(10px, -45px); }
          60% { transform: translate(-30px, -30px); }
          80% { transform: translate(20px, -50px); }
        }
        @keyframes urgent-text-flash {
          0%, 100% {
            color: rgba(200,170,110,1);
            filter: drop-shadow(0 0 15px rgba(200,170,110,0.4));
          }
          50% {
            color: rgba(230,200,130,1);
            filter: drop-shadow(0 0 20px rgba(230,200,130,0.6));
          }
        }
        @keyframes urgent-btn-flash {
          0%, 100% {
            color: rgba(200,170,110,1);
            background-color: rgba(200,170,110,0.1);
            border-color: rgba(200,170,110,0.3);
            filter: drop-shadow(0 0 15px rgba(200,170,110,0.4));
          }
          50% {
            color: rgba(230,200,130,1);
            background-color: rgba(230,200,130,0.1);
            border-color: rgba(230,200,130,0.4);
            filter: drop-shadow(0 0 20px rgba(230,200,130,0.6));
          }
        }
        @keyframes timer-ring-pulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.02); }
        }
      `}</style>

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

      <div className={styles.content()} style={{ animation: 'modal-entrance 400ms ease-out forwards' }}>
        <div className={styles.headingGroup()}>
          <h2
            className={styles.title()}
            style={{
              animation: isUrgent ? 'urgent-text-flash 0.8s infinite linear' : undefined,
              filter: isUrgent ? undefined : 'drop-shadow(0 0 15px rgba(200,170,110,0.4))',
            }}
          >
            Partida encontrada
          </h2>

          <div
            className={styles.subtitle()}
            style={{
              color: isUrgent ? undefined : 'rgba(200,170,110,0.7)',
              ...(isUrgent
                ? {
                    animationDelay: '200ms, 0s',
                    animationDuration: '400ms, 0.8s',
                    animationFillMode: 'forwards, none',
                    animationIterationCount: '1, infinite',
                    animationName: 'subtitle-entrance, urgent-text-flash',
                    animationTimingFunction: 'ease-out, linear',
                  }
                : {
                    animation: 'subtitle-entrance 400ms ease-out 200ms forwards',
                  }),
            }}
          >
            <span>Summoner&apos;s Rift</span>

            <span className={styles.subtitleDot()} />

            <span>Ranked</span>

            <span className={styles.subtitleDot()} />

            <span>5 vs 5</span>
          </div>
        </div>

        <div className={styles.timerWrap()}>
          <div className={styles.timerFrame()}>
            <div className={styles.timerOuter()} style={{ animation: 'timer-ring-pulse 3s infinite ease-in-out' }} />

            <div className={styles.timerMid()} style={{ animation: 'timer-ring-pulse 3s infinite ease-in-out 0.5s' }} />

            <div className={styles.timerInner()} style={{ animation: 'timer-ring-pulse 3s infinite ease-in-out 1s' }} />

            <span
              className={styles.timerText()}
              style={{
                animation: isUrgent
                  ? 'urgent-text-flash 0.8s infinite linear, timer-glow 2s infinite ease-in-out'
                  : 'timer-glow 2s infinite ease-in-out',
                filter: isUrgent ? undefined : 'drop-shadow(0 0 30px rgba(200,170,110,1))',
              }}
            >
              {formatTimer(timer)}
            </span>
          </div>
        </div>

        <div className={styles.actions()}>
          <div className={styles.actionWrap()} style={{ animation: 'button-breathe 3s infinite ease-in-out' }}>
            <div className={styles.actionTopBorder()} style={{ animation: 'border-travel 2s linear infinite' }} />

            <div className={styles.actionBottomBorder()} style={{ animation: 'border-travel 2s linear infinite reverse' }} />

            <button
              className={styles.acceptButton()}
              style={{ animation: isUrgent ? 'urgent-btn-flash 0.8s infinite linear' : undefined }}
              onClick={() => {
                return void accept()
              }}
              disabled={isLoading || hasResponded}
              type="button"
            >
              <div className={styles.acceptShimmer()} style={{ animation: 'shimmer-continuous 2s infinite' }} />

              <span
                className={styles.acceptLabel()}
                style={{
                  animation: isUrgent ? 'urgent-text-flash 0.8s infinite linear' : undefined,
                  filter: 'drop-shadow(0 0 10px rgba(200,170,110,0.8))',
                }}
              >
                Aceptar
              </span>
            </button>
          </div>

          <button
            className={styles.declineButton()}
            style={{
              animation: isUrgent ? 'urgent-text-flash 0.8s infinite linear' : undefined,
              opacity: isUrgent ? 0.6 : undefined,
            }}
            onClick={() => {
              return void decline()
            }}
            disabled={isLoading || hasResponded}
            type="button"
          >
            Declinar
          </button>
        </div>

        {error ? <p className={styles.error()}>{error.message}</p> : null}
      </div>
    </div>
  )
}
